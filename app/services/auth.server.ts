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

function generateUsername(publicKey: string): string {
  // Create a username like "solana_1abc" using the first 4 chars of the public key
  const prefix = "solana"
  const suffix = publicKey.slice(0, 4).toLowerCase()
  return `${prefix}_${suffix}`
}

// Update the Solana wallet strategy
authenticator.use(
  {
    name: "solana-wallet",
    async authenticate(request) {
      const form = await request.formData()
      const publicKey = form.get("publicKey") as string
      const signature = form.get("signature") as string
      const message = form.get("message") as string

      if (!publicKey || !signature || !message) {
        throw new Error("Missing authentication details")
      }

      try {
        // Verify signature
        const pubKey = new PublicKey(publicKey)
        const messageBytes = new TextEncoder().encode(message)
        const signatureBytes = bs58.decode(signature)
        
        const isValid = web3.nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          pubKey.toBytes()
        )

        if (!isValid) {
          throw new Error("Invalid signature")
        }

        // Find or create user with generated username
        let user = await db.user.findUnique({
          where: { publicKey },
        })

        if (!user) {
          // Generate a base username
          let username = generateUsername(publicKey)
          let suffix = 1

          // Keep trying until we find a unique username
          while (true) {
            try {
              user = await db.user.create({
                data: {
                  publicKey,
                  username: username,
                  fullname: `Solana User ${username}`, // Required field
                },
              })
              break
            } catch (e) {
              // If username exists, try next suffix
              username = generateUsername(publicKey) + suffix
              suffix++
            }
          }
        }

        return { id: user.id, publicKey: user.publicKey }
      } catch (error) {
        throw new Error(`Authentication failed: ${error.message}`)
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
