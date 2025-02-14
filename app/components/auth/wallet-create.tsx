import { useState, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { IconArrowLeft, IconDownload, IconEye, IconEyeOff } from "@tabler/icons-react"
import * as bip39 from "bip39"
import { Keypair } from "@solana/web3.js"

export default function WalletCreate({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<"generate" | "backup" | "verify">("generate")
  const [mnemonic, setMnemonic] = useState("")
  const [showPhrase, setShowPhrase] = useState(false)
  
  useEffect(() => {
    return () => {
      setMnemonic("")
      setShowPhrase(false)
    }
  }, [])

  function handleGenerateWallet() {
    const mnemonic = bip39.generateMnemonic()
    setMnemonic(mnemonic)
    setStep("backup")
  }

  function handleDownload() {
    const element = document.createElement("a")
    const file = new Blob([mnemonic], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "wallet-seed-phrase.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
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

        {step === "backup" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Backup Your Wallet</h1>
              <p className="mt-2 text-muted-foreground">
                Save these 12 words in a secure location. Never share them with anyone.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="rounded-lg border bg-muted p-4 font-mono">
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
                  onClick={() => setStep("verify")}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
