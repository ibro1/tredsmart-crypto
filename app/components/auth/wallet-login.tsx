import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useState, useEffect } from "react"
import { useFetcher } from "@remix-run/react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import bs58 from "bs58"

// Change from named export to default export
export default function WalletLogin({ onBack }: { onBack: () => void }) {
  const { publicKey, signMessage, connected } = useWallet()
  const fetcher = useFetcher()
  const [error, setError] = useState<string>()

  // Debounce the auto-login effect
  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return

    const timeoutId = setTimeout(handleLogin, 500)
    return () => clearTimeout(timeoutId)
  }, [connected, publicKey, signMessage])

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
          redirectTo: "/dashboard",
        },
        { method: "post", action: "/auth/wallet" }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message")
    }
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card className="p-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={onBack}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Connect Wallet</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your wallet to continue
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <WalletMultiButton />
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
      </Card>
    </div>
  )
}
