import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from "@remix-run/react"

import { NProgress } from "~/components/shared/nprogress"
import { ThemeHead, useTheme, type Theme } from "~/components/shared/theme"
import { configSite } from "~/configs/site"
import { useRootLoaderData } from "~/hooks/use-root-loader-data"

// Import Solana wallet adapter styles
import "@solana/wallet-adapter-react-ui/styles.css"
import { useEffect } from "react"

export function Document({
  dataTheme,
  children,
}: {
  dataTheme?: Theme | null
  children?: React.ReactNode
}) {
  const { ENV } = useRootLoaderData()
  const [theme] = useTheme()

  // useEffect(() => {
  //   function handleError(event: ErrorEvent) {
  //     if (event.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
  //       // Reload the page after a short delay
  //       setTimeout(() => {
  //         window.location.reload()
  //       }, 2000)
  //     }
  //   }

  //   window.addEventListener('error', handleError)
  //   return () => window.removeEventListener('error', handleError)
  // }, [])

  return (
    <html lang={configSite.languageCode} className={theme ?? ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content={`
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob: https:;
          font-src 'self';
          connect-src 'self' 
            https://*.solana.com
            https://*.projectserum.com
            https://rpc.ankr.com
            wss:;
          frame-src 'none';
        `.replace(/\s+/g, ' ').trim()} />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(dataTheme)} />
      </head>

      <body id="__remix">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ENV = ${JSON.stringify(ENV)};
              window.addEventListener('load', function() {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('ServiceWorker registration failed:', err);
                  });
                }
              });
            `,
          }}
        />
        <NProgress />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}


