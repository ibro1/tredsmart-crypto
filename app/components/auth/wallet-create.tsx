import { useState, useCallback, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { IconArrowLeft, IconDownload, IconEye, IconEyeOff, IconCopy, IconCheck } from "@tabler/icons-react"
import { Keypair } from "@solana/web3.js"
import { useFetcher } from "@remix-run/react"
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english'

export default function WalletCreate({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"generate" | "backup" | "verify">("generate")
  const [mnemonic, setMnemonic] = useState("")
  const [showPhrase, setShowPhrase] = useState(false)
  const [verifyWord, setVerifyWord] = useState({ index: -1, word: "" })
  const [error, setError] = useState("")
  const [hasCopied, setHasCopied] = useState(false)
  const [currentKeypair, setCurrentKeypair] = useState<Keypair | null>(null)
  const fetcher = useFetcher()

  // Clear sensitive data on unmount
  useEffect(() => () => {
    setMnemonic("")
    setShowPhrase(false)
  }, [])

  const handleGenerateWallet = useCallback(async () => {
    try {
      // Generate wallet with 12 words (128 bits)
      const newMnemonic = bip39.generateMnemonic(wordlist, 128)
      setMnemonic(newMnemonic)

      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(newMnemonic)
      const keypair = Keypair.fromSeed(seed.slice(0, 32))
      
      setCurrentKeypair(keypair)
      setStep("backup")
      setError("")
    } catch (err) {
      console.error("Wallet generation error:", err)
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
      setTimeout(() => URL.revokeObjectURL(element.href), 1000)
    } catch (err) {
      setError("Failed to download backup. Please try again.")
    }
  }, [mnemonic])

  const handleCopyPhrase = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (err) {
      setError("Failed to copy phrase. Please manually select and copy.")
    }
  }, [mnemonic])

  const startVerification = useCallback(() => {
    const words = mnemonic.split(" ")
    const randomIndex = Math.floor(Math.random() * words.length)
    setVerifyWord({ index: randomIndex, word: "" })
    setStep("verify")
  }, [mnemonic])

  const handleVerify = useCallback(async () => {
    try {
      if (!currentKeypair) {
        throw new Error("Wallet not properly generated")
      }

      const words = mnemonic.split(" ")
      const inputWord = verifyWord.word.trim().toLowerCase()
      const correctWord = words[verifyWord.index]?.toLowerCase()

      if (inputWord !== correctWord) {
        throw new Error("Incorrect word")
      }

      fetcher.submit(
        { 
          publicKey: currentKeypair.publicKey.toBase58(),
          action: "create" 
        },
        { method: "post", action: "/auth/wallet" }
      )
    } catch (err) {
      console.log(err)
      setError(err instanceof Error ? err.message : "Verification failed")
      setVerifyWord(prev => ({ ...prev, word: "" }))
    }
  }, [mnemonic, verifyWord, currentKeypair, fetcher])

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card className="p-6">
        <Button variant="ghost" className="mb-4" onClick={onBack}>
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
                Generate a secure Solana wallet with BIP39 recovery phrase
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <Button onClick={handleGenerateWallet}>
                Generate Secure Wallet
              </Button>
            </div>
          </>
        )}

        {step === "backup" && mnemonic && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Backup Recovery Phrase</h1>
              <p className="mt-2 text-muted-foreground">
                Write down these 12 words in order and keep them safe. You'll need them to recover your wallet.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="relative rounded-lg border bg-muted/50 p-6">
                {showPhrase ? (
                  <div className="grid grid-cols-3 gap-4">
                    {mnemonic.split(" ").map((word, i) => (
                      <div 
                        key={i} 
                        className="flex items-center rounded-md bg-background p-2 text-sm"
                      >
                        <span className="mr-2 text-xs text-muted-foreground">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="font-mono">{word}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex items-center rounded-md bg-background p-2 text-sm"
                      >
                        <span className="mr-2 text-xs text-muted-foreground">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="font-mono">•••••</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="absolute -top-3 right-4 flex gap-2 rounded-full bg-background px-2 py-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={handleCopyPhrase}
                    disabled={!showPhrase}
                    title="Copy phrase"
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
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setShowPhrase(!showPhrase)}
                    title={showPhrase ? "Hide phrase" : "Show phrase"}
                  >
                    {showPhrase ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🔐 Never share your recovery phrase. Anyone with these words can access your wallet.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownload}
                >
                  <IconDownload className="mr-2 h-4 w-4" />
                  Save Backup
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={startVerification}
                  disabled={!showPhrase}
                >
                  I Saved It
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Verify Recovery Phrase</h1>
              <p className="mt-2 text-muted-foreground">
                Enter word #{verifyWord.index + 1} from your backup phrase
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Input
                type="text"
                value={verifyWord.word}
                onChange={(e) => setVerifyWord(prev => ({
                  ...prev,
                  word: e.target.value
                }))}
                placeholder={`Word #${verifyWord.index + 1}`}
                autoComplete="off"
                autoCapitalize="none"
              />
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={!verifyWord.word.trim()}
              >
                Confirm & Activate Wallet
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}