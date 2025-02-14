import { useMemo, useEffect } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { getClientEnv } from "~/utils/env.shared"
import { RPCManager } from "./rpc-manager"

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const env = getClientEnv()

  // Initialize RPCManager early
  useEffect(() => {
    RPCManager.initialize(env.RPC_URL)
  }, [])

  const endpoint = useMemo(() => {
    // Ensure we have a valid endpoint
    return RPCManager.getCurrentEndpoint()
  }, [])

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  )

  if (!endpoint) {
    throw new Error("No valid RPC endpoint available")
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
