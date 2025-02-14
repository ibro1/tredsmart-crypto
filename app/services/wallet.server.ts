import { Connection, PublicKey } from "@solana/web3.js"
import { db } from "~/libs/db.server"
import { parsedEnv } from "~/utils/env.server"

// Get user's wallet address from database
export async function getUserWallet(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      walletAddress: true,
    },
  })

  if (!user?.walletAddress) {
    throw new Error("User wallet not connected")
  }

  return new PublicKey(user.walletAddress)
}

// Create Solana connection
export function createConnection() {
  return new Connection(parsedEnv.RPC_URL!)
}
