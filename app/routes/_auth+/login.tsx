import { type LoaderFunctionArgs } from "@remix-run/node"
// ...existing imports...
import { authService } from "~/services/auth.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return authService.isAuthenticated(request, {
    successRedirect: "/dashboard",
  })
}

// ...rest of the component code...
