import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { NATIVE_MINT } from "@solana/spl-token"
import axios from "axios"
import { API_URLS } from "@raydium-io/raydium-sdk-v2"
import { db } from "~/libs/db.server"
import { createConnection } from "./wallet.server"
import { logger } from "~/utils/logger.server"
import { getTokenPrice } from "./price.server"
import { parsedEnv } from "~/utils/env.server"

const isV0Tx = true
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

interface TokenBalance {
  mint: string
  amount: number
  decimals: number
}

async function getTokenBalances(connection: Connection, userPubkey: PublicKey): Promise<TokenBalance[]> {
  const accounts = await connection.getParsedTokenAccountsByOwner(userPubkey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  })
  
  return accounts.value.map(account => ({
    mint: account.account.data.parsed.info.mint,
    amount: account.account.data.parsed.info.tokenAmount.uiAmount,
    decimals: account.account.data.parsed.info.tokenAmount.decimals,
  }))
}

async function checkPositionLimits(
  user: any,
  tokenAddress: string,
  amount: number
): Promise<boolean> {
  
  // Get user's current position in this token
  const existingTrades = await db.trade.findMany({
    where: {
      userId: user.id,
      tokenAddress,
      status: "completed",
    },
  })

  const totalPosition = existingTrades.reduce(
    (sum, trade) => sum + trade.inputAmount,
    0
  )

  // Check if new trade would exceed position limit
  const newTotal = totalPosition + amount
  if (user.maxPositionSize && newTotal > user.maxPositionSize) {
    throw new Error("Trade would exceed maximum position size")
  }

  // Check token allocation limit
  const allTrades = await db.trade.findMany({
    where: {
      userId: user.id,
      status: "completed",
    },
  })

  const totalPortfolio = allTrades.reduce(
    (sum, trade) => sum + trade.inputAmount,
    0
  )

  const newAllocation = (newTotal / (totalPortfolio + amount)) * 100
  if (user.maxTokenAllocation && newAllocation > user.maxTokenAllocation) {
    throw new Error("Trade would exceed maximum token allocation")
  }

  return true
}

async function calculateProfitLoss(
  user: any,
  tokenAddress: string
): Promise<{ avgEntryPrice: number; profitLoss: number }> {
  const trades = await db.trade.findMany({
    where: {
      userId: user.id,
      tokenAddress,
      status: "completed",
    },
    orderBy: {
      executedAt: "asc",
    },
  })

  if (trades.length === 0) {
    return { avgEntryPrice: 0, profitLoss: 0 }
  }

  const totalAmount = trades.reduce((sum, trade) => sum + trade.inputAmount, 0)
  const totalCost = trades.reduce(
    (sum, trade) => sum + trade.inputAmount * trade.executionPrice!,
    0
  )

  const avgEntryPrice = totalCost / totalAmount
  const currentPrice = await getTokenPrice(tokenAddress)
  const profitLoss = ((currentPrice - avgEntryPrice) / avgEntryPrice) * 100

  return { avgEntryPrice, profitLoss }
}

export async function executeSwap(tokenSignalId: string) {
  const startTime = Date.now()
  let trade: any
  
  try {
    logger.info("Starting swap execution", { tokenSignalId })
    
    // Get token signal and user
    const tokenSignal = await db.tokenSignal.findUnique({
      where: { id: tokenSignalId },
      include: {
        tweet: {
          include: {
            influencer: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    })

    if (!tokenSignal) {
      throw new Error("Token signal not found")
    }

    // Get first user who tracks this influencer and has auto trading enabled
    const user = tokenSignal.tweet.influencer.users.find(
      (u) => u.autoTrading && u.walletAddress && u.tradeAmount
    )

    if (!user) {
      throw new Error("No eligible users for auto trading")
    }

    const amount = user.tradeAmount! * LAMPORTS_PER_SOL
    const slippage = user.maxSlippage || 5

    // Check trading limits
    await checkPositionLimits(user, tokenSignal.tokenAddress, user.tradeAmount!)

    // Get profit/loss info
    const { avgEntryPrice, profitLoss } = await calculateProfitLoss(
      user,
      tokenSignal.tokenAddress
    )

    // Create trade record
    trade = await db.trade.create({
      data: {
        tokenSignalId,
        userId: user.id,
        inputAmount: user.tradeAmount!,
        tokenAddress: tokenSignal.tokenAddress,
        platformFee: (user.tradeAmount! * parseFloat(parsedEnv.PLATFORM_FEE_PERCENT || "0.1")) / 100,
        stopLoss: user.stopLoss,
        takeProfit: user.takeProfit,
        avgEntryPrice,
        previousProfitLoss: profitLoss,
      },
    })

    // Setup connection
    const connection = createConnection()
    const userPubkey = new PublicKey(user.walletAddress!)

    // Check wallet balance
    const balance = await connection.getBalance(userPubkey)
    if (balance < amount) {
      throw new Error("Insufficient balance")
    }

    // Get priority fee
    const { data } = await axios.get<{
      id: string
      success: boolean
      data: { default: { vh: number; h: number; m: number } }
    }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`)

    // Get swap data with retries
    let swapResponse
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await axios.get(
          `${API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${NATIVE_MINT}&outputMint=${tokenSignal.tokenAddress}&amount=${amount}&slippageBps=${slippage * 100}&txVersion=V0`
        )
        swapResponse = response.data
        break
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      }
    }

    // Get swap transactions
    const { data: swapTransactions } = await axios.post<{
      id: string
      version: string
      success: boolean
      data: { transaction: string }[]
    }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
      computeUnitPriceMicroLamports: String(data.data.default.h),
      swapResponse,
      txVersion: "V0",
      wallet: userPubkey.toBase58(),
      wrapSol: true,
      unwrapSol: false,
    })

    // Process transactions
    const allTxBuf = swapTransactions.data.map((tx) =>
      Buffer.from(tx.transaction, "base64")
    )
    const allTransactions = allTxBuf.map((txBuf) =>
      isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
    )

    let finalTxId = ""
    for (const tx of allTransactions) {
      const transaction = tx as VersionedTransaction
      
      // User needs to sign transaction through their wallet
      // This will be handled by the frontend

      const txId = await connection.sendTransaction(tx as VersionedTransaction, {
        skipPreflight: true,
      })
      finalTxId = txId

      const { lastValidBlockHeight, blockhash } =
        await connection.getLatestBlockhash({
          commitment: "finalized",
        })

      await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature: txId,
        },
        "confirmed"
      )
    }

    // Get execution price
    const tokenBalances = await getTokenBalances(connection, userPubkey)
    const executedToken = tokenBalances.find(
      (t) => t.mint === tokenSignal.tokenAddress
    )
    const executionPrice = executedToken
      ? amount / (executedToken.amount * 10 ** executedToken.decimals)
      : null

    // Update trade record
    await db.trade.update({
      where: { id: trade.id },
      data: {
        status: "completed",
        txId: finalTxId,
        executedAt: new Date(),
        networkFee: data.data.default.h / 1e6, // Convert to SOL
        executionPrice,
        executionTime: Date.now() - startTime,
      },
    })

    // Update token signal
    await db.tokenSignal.update({
      where: { id: tokenSignalId },
      data: {
        status: "executed",
        executedAt: new Date(),
      },
    })

    logger.info("Swap completed successfully", {
      tokenSignalId,
      txId: finalTxId,
      executionTime: Date.now() - startTime,
    })

    return { success: true, trade }
  } catch (error) {
    logger.error("Swap failed", {
      tokenSignalId,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: Date.now() - startTime,
    })

    // Update trade record with error
    if (trade?.id) {
      await db.trade.update({
        where: { id: trade.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime: Date.now() - startTime,
        },
      })
    }

    throw error
  }
}
