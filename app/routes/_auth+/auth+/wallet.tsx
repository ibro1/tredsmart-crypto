import { json, redirect, type ActionFunctionArgs } from "@remix-run/node"
import { db } from "~/libs/db.server"
import { authenticator } from "~/services/auth.server"

function generateUsername(publicKey: string): string {
  const base = publicKey.slice(0, 8).toLowerCase()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `user_${base}${random}`
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData()
  const actionType = form.get("action")

  if (actionType === "create") {
    const publicKey = form.get("publicKey")
    if (typeof publicKey !== "string") {
      throw new Error("Invalid public key")
    }

    try {
      const username = generateUsername(publicKey)
      const user = await db.user.create({
        data: {
          publicKey,
          username,
          fullname: `Wallet ${publicKey.slice(0, 6)}`,
          walletAddress: publicKey,
          walletConnectedAt: new Date(),
        },
      })

      // Use a clone of the request since its body was already consumed
      return authenticator.authenticate("solana-wallet", request.clone(), {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        context: { user },
      })
    } catch (error) {
      console.error("Wallet creation error:", error)
      return json({ error: "Failed to create wallet" }, { status: 400 })
    }
  }

  // For normal wallet connection, also pass a cloned request
  return authenticator.authenticate("solana-wallet", request.clone(), {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  })
}
