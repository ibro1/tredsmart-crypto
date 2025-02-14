import { db } from "~/libs/db.server"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { createCookieSessionStorage, redirect } from "@remix-run/node"
import { parsedEnv } from "~/utils/env.server"

const SESSION_SECRET = parsedEnv.SESSION_SECRET

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_wallet_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

export async function createWalletAuthSession(
  walletAddress: string,
  redirectTo: string
) {
  const user = await getOrCreateUser(walletAddress)
  const session = await sessionStorage.getSession()
  session.set("userId", user.id)
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  })
}

async function getOrCreateUser(walletAddress: string) {
  const user = await db.user.findFirst({
    where: { walletAddress },
  })

  if (user) return user

  return db.user.create({
    data: {
      walletAddress,
      email: `${walletAddress}@wallet.user`,
      username: `wallet_${walletAddress.slice(0, 8)}`,
      fullname: `Wallet User ${walletAddress.slice(0, 8)}`,
    },
  })
}

export async function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
) {
  try {
    const signatureUint8 = bs58.decode(signature)
    const messageUint8 = new TextEncoder().encode(message)
    const publicKeyUint8 = bs58.decode(publicKey)

    return nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKeyUint8
    )
  } catch (error) {
    console.error("Signature verification failed:", error)
    return false
  }
}
