import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { retry } from "~/utils/retry"
import { RPCManager } from "./rpc-manager"

export async function getSolanaBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await retry(
      () => connection.getBalance(publicKey),
      {
        retries: 3,
        delay: 1000,
        onRetry: async (attempt) => {
          if (attempt === 2) {
            // On second retry, create new connection with rotated endpoint
            connection = await RPCManager.createConnection()
          }
        }
      }
    )
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error("Error getting SOL balance:", error)
    throw error
  }
}

export async function getTokenAccounts(
  connection: Connection,
  publicKey: PublicKey
) {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    )

    return tokenAccounts.value.map((account) => {
      const parsedInfo = account.account.data.parsed.info
      return {
        mint: parsedInfo.mint,
        amount: parsedInfo.tokenAmount.uiAmount,
        decimals: parsedInfo.tokenAmount.decimals,
        address: account.pubkey.toBase58(),
      }
    })
  } catch (error) {
    console.error("Error getting token accounts:", error)
    throw error
  }
}

export async function getRecentTransactions(
  connection: Connection,
  publicKey: PublicKey,
  limit = 10
) {
  try {
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    })

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })
        return {
          signature: sig.signature,
          timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
          status: tx?.meta?.err ? "failed" : "success",
          amount: tx?.meta?.postBalances[0]
            ? (tx.meta.postBalances[0] - tx.meta.preBalances[0]) /
              LAMPORTS_PER_SOL
            : 0,
        }
      })
    )

    return transactions
  } catch (error) {
    console.error("Error getting recent transactions:", error)
    throw error
  }
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
