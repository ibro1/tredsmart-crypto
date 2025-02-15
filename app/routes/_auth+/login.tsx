import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useState, useCallback } from "react"
import { Button } from "~/components/ui/button"
import { IconWallet, IconPlus, IconArrowRight } from "@tabler/icons-react"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"
import WalletLogin from "~/components/auth/wallet-login"
import WalletCreate from "~/components/auth/wallet-create"

export const meta: MetaFunction = () =>
  createMeta({
    title: "Login - TredSmart",
    description: "Connect your Solana wallet to start trading",
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Redirect to dashboard if already authenticated
  return authService.isAuthenticated(request, {
    successRedirect: "/dashboard",
  })
}

type Mode = "select" | "connect" | "create"

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("select")
  const [error, setError] = useState<string>()
  const { connected } = useWallet()
  const navigate = useNavigate()

  const handleModeChange = useCallback((newMode: Mode) => {
    setError(undefined)
    setMode(newMode)
  }, [])

  // If wallet is connected, try auto-login
  if (connected && mode === "select") {
    handleModeChange("connect")
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <div className="rounded-lg bg-background p-6 shadow-sm">
        {mode === "select" ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              <p className="mt-2 text-muted-foreground">
                Choose how you want to access your account
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <Button
                size="lg"
                className="flex items-center justify-between py-6"
                onClick={() => handleModeChange("connect")}
              >
                <div className="flex items-center">
                  <IconWallet className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Connect Wallet</div>
                    <div className="text-sm text-muted">
                      Use your existing Solana wallet
                    </div>
                  </div>
                </div>
                <IconArrowRight className="h-5 w-5 opacity-60" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex items-center justify-between py-6"
                onClick={() => handleModeChange("create")}
              >
                <div className="flex items-center">
                  <IconPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Create New Wallet</div>
                    <div className="text-sm text-muted">
                      Generate a new Solana wallet
                    </div>
                  </div>
                </div>
                <IconArrowRight className="h-5 w-5 opacity-60" />
              </Button>
            </div>

            {error && (
              <p className="mt-4 text-center text-sm text-destructive">{error}</p>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </a>
            </p>
          </>
        ) : mode === "connect" ? (
          <WalletLogin onBack={() => handleModeChange("select")} />
        ) : (
          <WalletCreate onBack={() => handleModeChange("select")} />
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
        <p className="font-medium">Security Tips:</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Verify you're on tredsmart.com before connecting</li>
          <li>We never store your private keys</li>
          <li>Never share your seed phrase with anyone</li>
        </ul>
      </div>
    </div>
  )
}
