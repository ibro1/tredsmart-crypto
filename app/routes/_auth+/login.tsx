import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useState, useCallback, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { IconWallet, IconPlus } from "@tabler/icons-react"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"
import WalletLogin from "~/components/auth/wallet-login"
import WalletCreate from "~/components/auth/wallet-create"

export const meta: MetaFunction = () =>
  createMeta({
    title: "Login - TredSmart",
    description: "Connect or create your wallet to start trading",
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return authService.isAuthenticated(request, {
    successRedirect: "/dashboard",
  })
}

type Mode = "select" | "connect" | "create"

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("select")
  const [isLoading, setIsLoading] = useState(false)
  const { connected, connecting } = useWallet()
  const navigate = useNavigate()

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode)
  }, [])

  const handleBack = useCallback(() => {
    setMode("select")
  }, [])

  useEffect(() => {
    let mounted = true

    const checkConnection = async () => {
      if (connected && mounted) {
        setIsLoading(true)
        try {
          await navigate("/dashboard")
        } catch (error) {
          console.error("Navigation error:", error)
        } finally {
          if (mounted) {
            setIsLoading(false)
          }
        }
      }
    }

    checkConnection()
    return () => {
      mounted = false
    }
  }, [connected, navigate])

  if (connecting || isLoading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Card className="p-6 text-center">
          <p>Connecting wallet...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card className="p-6">
        {mode === "select" ? (
          <SelectMode onModeChange={handleModeChange} />
        ) : mode === "connect" ? (
          <WalletLogin onBack={handleBack} />
        ) : (
          <WalletCreate onBack={handleBack} />
        )}
      </Card>
    </div>
  )
}

function SelectMode({ onModeChange }: { onModeChange: (mode: Mode) => void }) {
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to TredSmart</h1>
        <p className="mt-2 text-muted-foreground">
          Connect your existing wallet or create a new one to get started
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <Button
          size="lg"
          className="h-auto py-4"
          onClick={() => onModeChange("connect")}
        >
          <IconWallet className="mr-2 h-5 w-5" />
          Connect Existing Wallet
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="h-auto py-4"
          onClick={() => onModeChange("create")}
        >
          <IconPlus className="mr-2 h-5 w-5" />
          Create New Wallet
        </Button>
      </div>
    </>
  )
}