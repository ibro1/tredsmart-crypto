import { type LoaderFunctionArgs } from "@remix-run/node"
import { createEventStream } from "~/services/sse.server"
import { requireUser } from "~/helpers/auth"

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request)
  return createEventStream(request, "new-signal")
}
