import { json, redirect, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { IconWallet, IconPlus } from "@tabler/icons-react"
import { authService } from "~/services/auth.server"
import { createMeta } from "~/utils/meta"
import WalletCreate from "~/components/auth/wallet-create"
import WalletLogin from "~/components/auth/wallet-login"

export const meta: MetaFunction = () =>
  createMeta({
    title: "Sign Up - TredSmart",
    description: "Create or connect your Solana wallet to start trading",
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return authService.isAuthenticated(request, {
    successRedirect: "/dashboard",
  })
}

type SignupMode = "select" | "create" | "connect"

export default function SignupPage() {
  const [mode, setMode] = useState<SignupMode>("select")

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <div className="rounded-lg bg-background p-6 shadow-sm">
        {mode === "select" ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Get Started with TredSmart</h1>
              <p className="mt-2 text-muted-foreground">
                Choose how you want to start trading on TredSmart
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">New to Solana?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a new wallet to start your crypto journey
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setMode("create")}
                >
                  <IconPlus className="mr-2 h-5 w-5" />
                  Create New Wallet
                </Button>
              </div>

              <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Already have a wallet?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect your existing Solana wallet
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setMode("connect")}
                >
                  <IconWallet className="mr-2 h-5 w-5" />
                  Connect Existing Wallet
                </Button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </>
        ) : mode === "create" ? (
          <WalletCreate onBack={() => setMode("select")} />
        ) : (
          <WalletLogin onBack={() => setMode("select")} />
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
        <p className="font-medium">Important Security Information:</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Never share your wallet's seed phrase or private keys</li>
          <li>Always verify you're on tredsmart.com before connecting</li>
          <li>We never store your private keys or seed phrases</li>
          <li>Back up your wallet information in a secure location</li>
        </ul>
      </div>
    </div>
  )
}
