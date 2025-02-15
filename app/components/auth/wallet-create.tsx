import { useState, useCallback, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { IconArrowLeft, IconDownload, IconEye, IconEyeOff, IconCopy, IconCheck } from "@tabler/icons-react"
import { Keypair } from "@solana/web3.js"
import { useFetcher } from "@remix-run/react"
import bs58 from "bs58"

export default function WalletCreate({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"generate" | "backup" | "verify">("generate")
  const [mnemonic, setMnemonic] = useState("")
  const [showPhrase, setShowPhrase] = useState(false)
  const [verifyWord, setVerifyWord] = useState({ index: -1, word: "" })
  const [error, setError] = useState("")
  const [hasCopied, setHasCopied] = useState(false)
  const fetcher = useFetcher()

  useEffect(() => {
    return () => {
      setMnemonic("")
      setShowPhrase(false)
    }
  }, [])

  const handleGenerateWallet = useCallback(async () => {
    try {
      // Generate random bytes for entropy
      const entropy = new Uint8Array(32)
      window.crypto.getRandomValues(entropy)
      
      // Create keypair directly
      const keypair = Keypair.generate()
      
      // Convert secret key to words for backup
      const secretKeyBase58 = bs58.encode(keypair.secretKey)
      // Create deterministic words from the base58 string
      const words = secretKeyBase58.match(/.{1,8}/g) || []
      const newMnemonic = words.join(' ')

      setMnemonic(newMnemonic)
      setStep("backup")
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to generate wallet. Please try again.")
    }
  }, [])

  const handleDownload = useCallback(() => {
    try {
      const element = document.createElement("a")
      const file = new Blob([mnemonic], { type: "text/plain" })
      element.href = URL.createObjectURL(file)
      element.download = "wallet-seed-phrase.txt"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      URL.revokeObjectURL(element.href)
    } catch (err) {
      setError("Failed to download backup. Please try again.")
    }
  }, [mnemonic])

  const handleCopyPhrase = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      setError("Failed to copy phrase. Please try manually.")
    }
  }, [mnemonic])

  const startVerification = useCallback(() => {
    const words = mnemonic.split(" ")
    const randomIndex = Math.floor(Math.random() * words.length)
    setVerifyWord({ index: randomIndex, word: "" })
    setStep("verify")
  }, [mnemonic])

  const handleVerify = useCallback(async () => {
    const words = mnemonic.split(" ")
    if (words[verifyWord.index] === verifyWord.word.trim().toLowerCase()) {
      try {
        // Convert mnemonic back to keypair
        const secretKeyBase58 = words.join('')
        const secretKey = bs58.decode(secretKeyBase58)
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey))
        
        fetcher.submit(
          { 
            publicKey: keypair.publicKey.toBase58(),
            action: "create" 
          },
          { method: "post", action: "/auth/wallet" }
        )
      } catch (err) {
        setError("Failed to create wallet. Please try again.")
      }
    } else {
      setError("Incorrect word. Please try again.")
    }
  }, [mnemonic, verifyWord, fetcher])

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

        {error && (
          <div className="mb-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "generate" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Create New Wallet</h1>
              <p className="mt-2 text-muted-foreground">
                Generate a new Solana wallet and secure backup phrase
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <Button onClick={handleGenerateWallet}>
                Generate New Wallet
              </Button>
            </div>
          </>
        )}

        {step === "backup" && mnemonic && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Backup Your Wallet</h1>
              <p className="mt-2 text-muted-foreground">
                Save these 24 words in a secure location. Never share them with anyone.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="rounded-lg border bg-muted p-4 font-mono text-sm">
                  {showPhrase ? (
                    <div className="grid grid-cols-3 gap-2">
                      {mnemonic.split(" ").map((word, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-muted-foreground">{i + 1}.</span>{" "}
                          {word}
                        </div>
                      ))}
                    </div>
                  ) : (
                    "••••• ••••• ••••• •••••"
                  )}
                </div>
                <div className="absolute right-2 top-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPhrase}
                    disabled={!showPhrase}
                  >
                    {hasCopied ? (
                      <IconCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPhrase(!showPhrase)}
                  >
                    {showPhrase ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <IconDownload className="mr-2 h-4 w-4" />
                  Download Backup
                </Button>
                <Button
                  className="flex-1"
                  onClick={startVerification}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Verify Your Backup</h1>
              <p className="mt-2 text-muted-foreground">
                Enter word #{verifyWord.index + 1} from your backup phrase
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Input
                type="text"      
                value={verifyWord.word}
                onChange={(e) => setVerifyWord(prev => ({ ...prev, word: e.target.value }))}
                placeholder="Enter the word"
                autoComplete="off"
                autoCapitalize="off"
              />
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={!verifyWord.word.trim()}
              >
                Verify & Create Wallet
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
