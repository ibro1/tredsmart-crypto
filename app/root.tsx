import {
  json,
  redirect,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { Outlet, useLoaderData, useRouteError } from "@remix-run/react"
import { captureRemixErrorBoundaryError, withSentry } from "@sentry/remix"
import { useEffect } from "react"

import { GeneralErrorBoundary } from "~/components/shared/error-boundary"
import { ThemeProvider, type Theme } from "~/components/shared/theme"
import { configDocumentLinks } from "~/configs/document"
import { configSite } from "~/configs/site"
import { Document } from "~/document"
import { modelUser } from "~/models/user.server"
import { authService } from "~/services/auth.server"
import { getThemeSession } from "~/services/theme.server"
import { parsedEnv, parsedEnvClient } from "~/utils/env.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { SolanaProvider } from "~/lib/solana/context"
import { startTweetTracking } from "~/jobs/tweet-tracker.server"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: configSite.title,
    description: configSite.description,
  })

export const links: LinksFunction = () => configDocumentLinks

export async function loader({ request }: LoaderFunctionArgs) {
  const themeSession = await getThemeSession(request)
  const theme = themeSession.getTheme()

  const userSession = await authService.isAuthenticated(request)
  if (!userSession) {
    // Start tweet tracking job
    if (parsedEnv.NODE_ENV === "production") {
      startTweetTracking().catch((error) => {
        console.error("Failed to start tweet tracking:", error)
      })
    }

    return json({
      ENV: parsedEnvClient,
      theme,
      userSession: null,
      userData: null,
    })
  }

  const userData = await modelUser.getForSession({ id: userSession.id })
  if (!userData) return redirect(`/logout`)

  // Start tweet tracking job
  if (parsedEnv.NODE_ENV === "production") {
    startTweetTracking().catch((error) => {
      console.error("Failed to start tweet tracking:", error)
    })
  }

  return json({
    ENV: parsedEnvClient,
    theme,
    userSession,
    userData,
  })
}

function RootRoute() {
  const data = useLoaderData<typeof loader>()

  useEffect(() => {
    window.ENV = data.ENV

    // Add chunk load error handler
    window.addEventListener('error', (event) => {
      if (event.message.includes('chunk') || event.message.includes('loading')) {
        console.error('Chunk loading error:', event)
        // Refresh the page after a short delay
        setTimeout(() => window.location.reload(), 1000)
      }
    })
  }, [data.ENV])

  return (
    <ThemeProvider specifiedTheme={data.theme}>
      <Document dataTheme={data.theme}>
        <SolanaProvider>
          <Outlet />
        </SolanaProvider>
      </Document>
    </ThemeProvider>
  )
}

export default withSentry(RootRoute)

export function ErrorBoundary() {
  const error = useRouteError()
  captureRemixErrorBoundaryError(error)

  return (
    <ThemeProvider specifiedTheme={"" as Theme}>
      <Document dataTheme={"" as Theme}>
        <GeneralErrorBoundary />
      </Document>
    </ThemeProvider>
  )
}
