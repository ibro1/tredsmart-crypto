import { json, type ActionFunctionArgs } from "@remix-run/node"
import { createWalletAuthSession, verifyWalletSignature } from "~/services/wallet-auth.server"

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const message = formData.get("message")
  const signature = formData.get("signature")
  const publicKey = formData.get("publicKey")
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard"

  if (
    typeof message !== "string" ||
    typeof signature !== "string" ||
    typeof publicKey !== "string"
  ) {
    return json({ error: "Invalid form data" }, { status: 400 })
  }

  const isValid = await verifyWalletSignature(message, signature, publicKey)
  if (!isValid) {
    return json({ error: "Invalid signature" }, { status: 400 })
  }

  return createWalletAuthSession(publicKey, redirectTo)
}
