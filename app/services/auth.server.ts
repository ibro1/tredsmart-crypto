import { type Prisma } from "@prisma/client"
import { createCookieSessionStorage } from "@remix-run/node"
import { Authenticator } from "remix-auth"
import { verify } from "@solana/web3.js"
import bs58 from "bs58"

import { type modelUser } from "~/models/user.server"
import { AuthStrategies } from "~/services/auth-strategies"
import { formStrategy } from "~/services/auth-strategies/form.strategy"
import { githubStrategy } from "~/services/auth-strategies/github.strategy"
import { googleStrategy } from "~/services/auth-strategies/google.strategy"
import { convertDaysToSeconds } from "~/utils/datetime"
import { isProduction, parsedEnv } from "~/utils/env.server"
import { prisma } from "./db.server"

export const authStorage = createCookieSessionStorage({
  cookie: {
    name: "__auth_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [parsedEnv.SESSION_SECRET],
    secure: isProduction,
    maxAge: convertDaysToSeconds(30), // EDITME: Change session persistence
  },
})

/**
 * UserSession is stored in the cookie
 */
export interface UserSession {
  id: string
  // Add user properties here or extend with a type from the database
}

/**
 * UserData is not stored in the cookie, only retrieved when necessary
 */
export interface UserData
  extends NonNullable<Prisma.PromiseReturnType<typeof modelUser.getForSession>> {}

export type AuthStrategy = (typeof AuthStrategies)[keyof typeof AuthStrategies]

/**
 * authService
 *
 * Create an instance of the authenticator, pass a generic with what
 * strategies will return and will store in the session
 *
 * When using this, might need to have a cloned request
 * const clonedRequest = request.clone()
 */
export const authService = new Authenticator<UserSession>(authStorage)

authService.use(formStrategy, AuthStrategies.FORM)
authService.use(githubStrategy, AuthStrategies.GITHUB)
authService.use(googleStrategy, AuthStrategies.GOOGLE)

authService.use(
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

      // Verify signature
      const isValid = verify(
        bs58.decode(signature),
        new TextEncoder().encode(message),
        bs58.decode(publicKey)
      )

      if (!isValid) {
        throw new Error("Invalid signature")
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { publicKey },
      })

      if (!user) {
        user = await prisma.user.create({
          data: { publicKey },
        })
      }

      return user
    },
  },
  "solana-wallet"
)

// Helper functions
export const authService = {
  authenticate: authenticator.authenticate.bind(authenticator),
  isAuthenticated: authenticator.isAuthenticated.bind(authenticator),
  logout: authenticator.logout.bind(authenticator),
}

export { authenticator }
