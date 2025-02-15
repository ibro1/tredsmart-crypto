import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useState, useCallback } from "react"
import { useFetcher } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export default function WalletLogin({ onBack }: { onBack: () => void }) {
  const { publicKey, signMessage, connected } = useWallet()
  const fetcher = useFetcher()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string>()

  const handleSignMessage = useCallback(async () => {
    if (!publicKey || !signMessage || isSigningIn) return

    setIsSigningIn(true)
    setError(undefined)

    try {
      const message = `Sign in to TredSmart\nNonce: ${Date.now()}`
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)

      fetcher.submit(
        {
          message,
          signature: Buffer.from(signature).toString("base58"),
          publicKey: publicKey.toBase58(),
        },
        { method: "post", action: "/auth/wallet" }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message")
    } finally {
      setIsSigningIn(false)
    }
  }, [publicKey, signMessage, fetcher, isSigningIn])

  // Auto-sign when wallet is connected
  if (connected && !isSigningIn && !error) {
    handleSignMessage()
  }

  return (
    <>
      <Button
        variant="ghost"
        className="mb-4"
        onClick={onBack}
        disabled={isSigningIn}
      >
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center">
        <h1 className="text-2xl font-bold">Connect Wallet</h1>
        <p className="mt-2 text-muted-foreground">
          {isSigningIn ? "Signing in..." : "Connect your wallet to continue"}
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <WalletMultiButton disabled={isSigningIn} />
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}
    </>
  )
}
