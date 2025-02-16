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
      // Generate wallet with 24 words (256 bits)
      const newMnemonic = bip39.generateMnemonic(wordlist, 256)
      setMnemonic(newMnemonic)

      // Convert mnemonic to seed
      const seed = await bip39.mnemonicToSeed(newMnemonic)
      
      // Create keypair from first 32 bytes of seed
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
                Write down these 24 words in order. This is your master key.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="rounded-lg border bg-muted p-4 font-mono text-sm">
                  {showPhrase ? (
                    <div className="grid grid-cols-3 gap-2">
                      {mnemonic.split(" ").map((word, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          {word}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          ••••••
                        </div>
                      ))}
                    </div>
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
                  Export Secure File
                </Button>
                <Button className="flex-1" onClick={startVerification}>
                  Verify Backup
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