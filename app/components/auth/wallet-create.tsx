import { useState, useCallback, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { IconArrowLeft, IconDownload, IconEye, IconEyeOff } from "@tabler/icons-react"
import * as bip39 from "bip39"
import { Keypair } from "@solana/web3.js"

export default function WalletCreate({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"generate" | "backup" | "verify">("generate")
  const [mnemonic, setMnemonic] = useState("")
  const [showPhrase, setShowPhrase] = useState(false)
  const [verifyWord, setVerifyWord] = useState({ index: -1, word: "" })
  const [error, setError] = useState("")

  useEffect(() => {
    return () => {
      setMnemonic("")
      setShowPhrase(false)
    }
  }, [])

  const handleGenerateWallet = useCallback(() => {
    try {
      const newMnemonic = bip39.generateMnemonic(256) // Using 24 words for better security
      setMnemonic(newMnemonic)
      setStep("backup")
      setError("")
    } catch (err) {
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

  const startVerification = useCallback(() => {
    const words = mnemonic.split(" ")
    const randomIndex = Math.floor(Math.random() * words.length)
    setVerifyWord({ index: randomIndex, word: "" })
    setStep("verify")
  }, [mnemonic])

  const handleVerify = useCallback(() => {
    const words = mnemonic.split(" ")
    if (words[verifyWord.index] === verifyWord.word.trim().toLowerCase()) {
      // Create the wallet
      const seed = bip39.mnemonicToSeedSync(mnemonic)
      const keypair = Keypair.fromSeed(seed.slice(0, 32))
      console.log("Wallet created:", keypair.publicKey.toBase58())
      // TODO: Handle the new wallet (store it, connect it, etc.)
    } else {
      setError("Incorrect word. Please try again.")
    }
  }, [mnemonic, verifyWord])

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
                <div className="rounded-lg border bg-muted p-4 font-mono text-sm break-all">
                  {showPhrase ? mnemonic : "••••• ••••• ••••• •••••"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => setShowPhrase(!showPhrase)}
                >
                  {showPhrase ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </Button>
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
