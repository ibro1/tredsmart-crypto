import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useState } from "react"
import { useFetcher } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { Alert } from "~/components/ui/alert"
import bs58 from "bs58"

export function WalletAuth({ redirectTo = "/dashboard" }) {
  const { publicKey, signMessage } = useWallet()
  const fetcher = useFetcher()
  const [error, setError] = useState<string>()

  async function handleLogin() {
    if (!publicKey || !signMessage) return

    try {
      const message = `Sign in to TredSmart\nNonce: ${Date.now()}`
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)
      const signatureStr = bs58.encode(signature)

      fetcher.submit(
        {
          message,
          signature: signatureStr,
          publicKey: publicKey.toBase58(),
          redirectTo,
        },
        { method: "post", action: "/auth/wallet" }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <WalletMultiButton />
      {publicKey && (
        <Button onClick={handleLogin} disabled={fetcher.state === "submitting"}>
          {fetcher.state === "submitting" ? "Signing in..." : "Sign in with Wallet"}
        </Button>
      )}
      {error && (
        <Alert variant="destructive">{error}</Alert>
      )}
    </div>
  )
}
