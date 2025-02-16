import { json, redirect, type ActionFunctionArgs } from "@remix-run/node"
import { authenticator } from "~/services/auth.server"

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Let authenticator handle both creation and login
    return await authenticator.authenticate("solana-wallet", request, {
      successRedirect: "/user/dashboard",
      failureRedirect: "/login",
    })
  } catch (error) {
    console.error("Wallet auth error:", error)
    return json(
      { 
        error: error instanceof Error ? error.message : "Authentication failed" 
      }, 
      { status: 400 }
    )
  }
}
