import { type Prisma } from "@prisma/client"
import { createCookieSessionStorage } from "@remix-run/node"
import { Authenticator } from "remix-auth"
import { db } from "~/libs/db.server"
import { type modelUser } from "~/models/user.server"
import { AuthStrategies } from "~/services/auth-strategies"
import { formStrategy } from "~/services/auth-strategies/form.strategy"
import { githubStrategy } from "~/services/auth-strategies/github.strategy"
import { googleStrategy } from "~/services/auth-strategies/google.strategy"
import { convertDaysToSeconds } from "~/utils/datetime"
import { isProduction, parsedEnv } from "~/utils/env.server"

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

// Add Solana wallet strategy
authenticator.use(
  {
    name: "solana-wallet",
    async authenticate(request) {
      const form = await request.formData()
      const publicKey = form.get("publicKey") as string
      const action = form.get("action") as string

      if (!publicKey) {
        throw new Error("Missing public key")
      }

      try {
        // Find or create user
        let user = await db.user.findUnique({
          where: { publicKey },
          select: {
            id: true,
            publicKey: true,
            username: true,
          }
        })

        if (action === "create" && !user) {
          const username = `user_${publicKey.slice(0, 8)}${Math.floor(Math.random() * 1000)}`
          user = await db.user.create({
            data: {
              publicKey,
              username,
              fullname: `Wallet ${publicKey.slice(0, 6)}`,
              walletAddress: publicKey,
              walletConnectedAt: new Date(),
            },
            select: {
              id: true,
              publicKey: true,
              username: true,
            }
          })
        }

        if (!user) {
          throw new Error("User not found")
        }

        // Return session data in the format expected by the authenticator
        return {
          id: user.id
        }
      } catch (error) {
        console.error("Wallet auth error:", error)
        throw new Error(error instanceof Error ? error.message : "Authentication failed")
      }
    }
  },
  "solana-wallet"
)

// Add other strategies
authenticator.use(formStrategy, AuthStrategies.FORM)
authenticator.use(githubStrategy, AuthStrategies.GITHUB)
authenticator.use(googleStrategy, AuthStrategies.GOOGLE)

export const authService = {
  authenticate: authenticator.authenticate.bind(authenticator),
  isAuthenticated: authenticator.isAuthenticated.bind(authenticator),
  logout: authenticator.logout.bind(authenticator),
}

export { authenticator }
