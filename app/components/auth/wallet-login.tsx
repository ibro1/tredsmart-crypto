import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useState, useCallback, useEffect } from "react"
import { useFetcher } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import bs58 from "bs58"

export default function WalletLogin({ onBack }: { onBack: () => void }) {
  const { publicKey, signMessage, connected, connecting } = useWallet()
  const fetcher = useFetcher()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string>()

  // Clear error when connection state changes
  useEffect(() => {
    if (connecting) {
      setError(undefined)
    }
  }, [connecting])

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
          signature: bs58.encode(signature),
          publicKey: publicKey.toBase58(),
        },
        { method: "post", action: "/auth/wallet" }
      )
    } catch (err) {
      // Only show errors that aren't user rejections
      if (err instanceof Error && !err.message.includes("User rejected")) {
        setError(err.message)
      }
    } finally {
      setIsSigningIn(false)
    }
  }, [publicKey, signMessage, fetcher, isSigningIn])

  // Only attempt auto-sign when explicitly connected
  useEffect(() => {
    if (connected && !isSigningIn && !error) {
      handleSignMessage()
    }
  }, [connected, isSigningIn, error, handleSignMessage])

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
        <WalletMultiButton 
          disabled={isSigningIn}
        />
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}
    </>
  )
}
