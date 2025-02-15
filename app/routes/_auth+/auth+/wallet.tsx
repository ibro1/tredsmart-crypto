// import { json, type ActionFunctionArgs } from "@remix-run/node"
// import { createWalletAuthSession, verifyWalletSignature } from "~/services/wallet-auth.server"

// export async function action({ request }: ActionFunctionArgs) {
//   const formData = await request.formData()
//   const message = formData.get("message")
//   const signature = formData.get("signature")
//   const publicKey = formData.get("publicKey")
//   const redirectTo = (formData.get("redirectTo") as string) || "/dashboard"

//   if (
//     typeof message !== "string" ||
//     typeof signature !== "string" ||
//     typeof publicKey !== "string"
//   ) {
//     return json({ error: "Invalid form data" }, { status: 400 })
//   }

//   const isValid = await verifyWalletSignature(message, signature, publicKey)
//   if (!isValid) {
//     return json({ error: "Invalid signature" }, { status: 400 })
//   }

//   return createWalletAuthSession(publicKey, redirectTo)
// }


import { json, redirect, type ActionFunctionArgs } from "@remix-run/node"
import { db } from "~/libs/db.server"
import { authenticator } from "~/services/auth.server"

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const action = form.get("action")

  if (action === "create") {
    const publicKey = form.get("publicKey")
    if (typeof publicKey !== "string") {
      throw new Error("Invalid public key")
    }

    try {
      // Create user with new wallet
      const user = await db.user.create({
        data: { publicKey },
      })

      // Log them in using the authenticator
      return authenticator.authenticate("solana-wallet", request, {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        context: { user },
      })
    } catch (error) {
      return json({ error: "Failed to create wallet" }, { status: 400 })
    }
  }

  // Handle normal wallet connection
  return authenticator.authenticate("solana-wallet", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
}
