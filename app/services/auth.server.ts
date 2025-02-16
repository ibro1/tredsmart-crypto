import { type Prisma } from "@prisma/client"
import { createCookieSessionStorage } from "@remix-run/node"
import { Authenticator } from "remix-auth"
import * as web3 from "@solana/web3.js"
import { PublicKey } from "@solana/web3.js"
import bs58 from "bs58"

import { type modelUser } from "~/models/user.server"
import { AuthStrategies } from "~/services/auth-strategies"
import { formStrategy } from "~/services/auth-strategies/form.strategy"
import { githubStrategy } from "~/services/auth-strategies/github.strategy"
import { googleStrategy } from "~/services/auth-strategies/google.strategy"
import { convertDaysToSeconds } from "~/utils/datetime"
import { isProduction, parsedEnv } from "~/utils/env.server"
import { db } from "~/libs/db.server"

export const authStorage = createCookieSessionStorage({
  cookie: {
    name: "__auth_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [parsedEnv.SESSION_SECRET],
    secure: isProduction,
    maxAge: convertDaysToSeconds(30),
  },
})

export interface UserSession {
  id: string
  publicKey?: string
}

export interface UserData
  extends NonNullable<Prisma.PromiseReturnType<typeof modelUser.getForSession>> {}

export type AuthStrategy = (typeof AuthStrategies)[keyof typeof AuthStrategies]

// Create a single authenticator instance
const authenticator = new Authenticator<UserSession>(authStorage)

// Add the existing strategies
authenticator.use(formStrategy, AuthStrategies.FORM)
authenticator.use(githubStrategy, AuthStrategies.GITHUB)
authenticator.use(googleStrategy, AuthStrategies.GOOGLE)

// Add helper function to generate username from public key
function generateUsername(publicKey: string): string {
  // Take first 8 characters of public key and add random numbers
  const base = publicKey.slice(0, 8).toLowerCase()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `user_${base}${random}`
}

// Update Solana wallet strategy
authenticator.use(
  {
    name: "solana-wallet",
    async authenticate(request) {
      const form = await request.formData()
      const reqAction = form.get("action")?.toString()
      const publicKey = form.get("publicKey") as string

      if (!publicKey) {
        throw new Error("Missing authentication details")
      }

      // If action is "create", skip signature verification
      if (reqAction === "create") {
        let user = await db.user.findUnique({
          where: { publicKey },
          select: { id: true, publicKey: true, username: true },
        })

        if (!user) {
          const username = generateUsername(publicKey)
          user = await db.user.create({
            data: {
              publicKey,
              username,
              fullname: `Wallet ${publicKey.slice(0, 6)}`,
              walletAddress: publicKey,
              walletConnectedAt: new Date(),
            },
            select: { id: true, publicKey: true, username: true },
          })
        }
        return user
      }

      // Normal login flow: require signature and message
      const signature = form.get("signature") as string
      const message = form.get("message") as string

      if (!signature || !message) {
        throw new Error("Missing authentication details")
      }

      try {
        const pubKey = new PublicKey(publicKey)
        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = bs58.decode(signature)
        const isValid = web3.nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          pubKey.toBytes()
        )
        if (!isValid) throw new Error("Invalid signature")

        // Lookup or create user as needed
        let user = await db.user.findUnique({
          where: { publicKey },
          select: { id: true, publicKey: true, username: true },
        })
        if (!user) {
          const username = generateUsername(publicKey)
          user = await db.user.create({
            data: {
              publicKey,
              username,
              fullname: `Wallet ${publicKey.slice(0, 6)}`,
              walletAddress: publicKey,
              walletConnectedAt: new Date(),
            },
            select: { id: true, publicKey: true, username: true },
          })
        }
        return user
      } catch (error) {
        console.error("Authentication error:", error)
        throw new Error(
          `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    },
  },
  "solana-wallet"
)

// Export the auth service with helper methods
export const authService = {
  authenticate: authenticator.authenticate.bind(authenticator),
  isAuthenticated: authenticator.isAuthenticated.bind(authenticator),
  logout: authenticator.logout.bind(authenticator),
}

// Export the authenticator for direct access when needed
export { authenticator }
