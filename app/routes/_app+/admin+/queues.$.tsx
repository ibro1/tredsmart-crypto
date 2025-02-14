import { serverAdapter } from "~/queues/config.server"
import { type LoaderFunctionArgs } from "@remix-run/node"
import { requireUser } from "~/helpers/auth"

export const loader = async ({ request }: LoaderFunctionArgs) => {
await requireUser(request, ["ADMIN"])


  const expressRequest = {
    baseUrl: "/admin/queues",
    originalUrl: new URL(request.url).pathname,
    query: Object.fromEntries(new URL(request.url).searchParams),
    headers: Object.fromEntries(request.headers),
    method: request.method,
  }

  return serverAdapter.getRouter()(expressRequest)
}
