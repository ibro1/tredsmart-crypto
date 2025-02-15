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
      console.log(err)
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
    
    </div>
  )
}
