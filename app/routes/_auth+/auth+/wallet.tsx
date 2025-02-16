import { json, type ActionFunctionArgs } from "@remix-run/node"
import { authenticator } from "~/services/auth.server"

export async function action({ request }: ActionFunctionArgs) {
  // Clone the request before reading
  const clone = request.clone()
  const form = await clone.formData()
  const actionType = form.get("action")

  // Pass through to authenticator with original request
  return authenticator.authenticate("solana-wallet", request, {
    successRedirect: "/user/dashboard",
    failureRedirect: "/login",
    // Pass action type so auth strategy knows what to do
    context: { action: actionType },
  })
}
