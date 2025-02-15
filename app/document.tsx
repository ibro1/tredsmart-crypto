import { Links, LiveReload, Meta, Scripts, ScrollRestoration } from "@remix-run/react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"
import { useMemo } from "react"

import { NProgress } from "~/components/shared/nprogress"
import { ThemeHead, useTheme, type Theme } from "~/components/shared/theme"
import { configSite } from "~/configs/site"
import { useRootLoaderData } from "~/hooks/use-root-loader-data"

// Import Solana wallet styles
import "@solana/wallet-adapter-react-ui/styles.css"

export function Document({
  dataTheme,
  children,
}: {
  dataTheme?: Theme | null
  children?: React.ReactNode
}) {
  const { ENV } = useRootLoaderData()
  const [theme] = useTheme()

  // Set up Solana network connection
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []) // or "mainnet-beta" for production
  
  // Set up supported wallets with proper config
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({
        network: "devnet",
      }),
    ],
    []
  )

  return (
    <html lang={configSite.languageCode} className={theme ?? ""}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(dataTheme)} />
      </head>

      <body id="__remix">
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider 
            wallets={wallets} 
            autoConnect={false}
            onError={(error) => {
              // Only log actual errors, not user rejections
              if (!error.message.includes("User rejected")) {
                console.error("Wallet error:", error)
              }
            }}
          >
            <WalletModalProvider>
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
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
