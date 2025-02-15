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



  return (
    <div className="container mx-auto max-w-lg px-4 py-12">

    </div>
  )
}

