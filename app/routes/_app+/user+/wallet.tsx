import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node"
import { Form, useLoaderData, Link } from "@remix-run/react"
import {
  IconPlus,
  IconWallet,
  IconShieldLock,
  IconDownload,
  IconUpload,
  IconKey,
  IconRefresh,
  IconCopy,
  IconQrcode,
  IconSettings,
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { requireUser } from "~/helpers/auth"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { cn } from "~/utils/cn"
import {
  getSolanaBalance,
  getTokenAccounts,
  getRecentTransactions,
  shortenAddress,
} from "~/lib/solana/utils"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `Solana Wallet - TredSmart`,
    description: `Manage your Solana wallet, view balances, and secure your assets`,
  })

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await requireUser(request)
  const formData = await request.formData()
  
  if (formData.get("_action") === "updateSettings") {
    await db.user.update({
      where: { id: user.id },
      data: {
        autoTrading: formData.get("autoTrading") === "true",
        tradeAmount: formData.get("tradeAmount") ? parseFloat(formData.get("tradeAmount") as string) : null,
        maxSlippage: formData.get("maxSlippage") ? parseFloat(formData.get("maxSlippage") as string) : null,
        stopLoss: formData.get("stopLoss") ? parseFloat(formData.get("stopLoss") as string) : null,
        takeProfit: formData.get("takeProfit") ? parseFloat(formData.get("takeProfit") as string) : null,
      },
    })
  }
  
  if (formData.get("_action") === "connectWallet") {
    const walletAddress = formData.get("walletAddress")
    if (typeof walletAddress !== "string") throw new Error("Invalid wallet address")
    
    await db.user.update({
      where: { id: user.id },
      data: {
        walletAddress,
        walletConnectedAt: new Date(),
      },
    })
  }

  return json({ success: true })
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await requireUser(request)
  return json({ user })
}

export default function WalletManagementRoute() {
  const { user } = useLoaderData<typeof loader>()
  const [activeTab, setActiveTab] = useState("wallet")
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  const [balance, setBalance] = useState<number>(0)
  const [tokens, setTokens] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWalletData() {
      if (!publicKey || !connected) return

      try {
        setLoading(true)
        const [solBalance, tokenAccounts, recentTxs] = await Promise.all([
          getSolanaBalance(connection, publicKey),
          getTokenAccounts(connection, publicKey),
          getRecentTransactions(connection, publicKey),
        ])

        setBalance(solBalance / LAMPORTS_PER_SOL) // Convert lamports to SOL
        setTokens(tokenAccounts)
        setTransactions(recentTxs)
      } catch (error) {
        console.error("Error fetching wallet data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWalletData()
  }, [publicKey, connected, connection])

  useEffect(() => {
    // Save wallet address when connected
    if (connected && publicKey && (!user.walletAddress || user.walletAddress !== publicKey.toBase58())) {
      const formData = new FormData()
      formData.append("_action", "connectWallet")
      formData.append("walletAddress", publicKey.toBase58())
      fetch("/user/wallet", { method: "POST", body: formData })
    }
  }, [connected, publicKey, user.walletAddress])

  return (
    <div className="app-container space-y-8">
      <header className="app-header items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solana Wallet</h1>
          <p className="text-muted-foreground">
            Manage your Solana wallet and assets
          </p>
        </div>
        <WalletMultiButton />
      </header>

      {connected && publicKey ? (
        <>
          {/* Navigation Tabs */}
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "wallet", label: "Wallet", icon: IconWallet },
                { id: "trading", label: "Trading Settings", icon: IconSettings },
                { id: "backup", label: "Backup & Security", icon: IconShieldLock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-1 pb-4 pt-2 text-sm font-medium",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Wallet Section */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              {/* Wallet Address */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Wallet Address</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        {publicKey.toBase58()}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigator.clipboard.writeText(publicKey.toBase58())
                        }
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    <IconRefresh className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </Card>

              {/* SOL Balance */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">SOL Balance</h3>
                    <p className="mt-1 text-3xl font-bold">
                      {balance.toFixed(4)} SOL
                    </p>
                    <p className="text-muted-foreground">
                      ≈ ${(balance * 95).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://solscan.io/account/${publicKey.toBase58()}`,
                          "_blank"
                        )
                      }
                    >
                      View on Solscan
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Token Balances */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">Token Balances</h3>
                <div className="space-y-4">
                  {tokens.map((token) => (
                    <Card key={token.mint} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{token.mint}</h4>
                          <p className="text-sm text-muted-foreground">
                            {token.amount.toLocaleString()} tokens
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://solscan.io/token/${token.mint}`,
                              "_blank"
                            )
                          }
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
                <Card>
                  <div className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <div
                        key={tx.signature}
                        className="flex items-center justify-between p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {tx.amount > 0 ? "Received" : "Sent"}{" "}
                            {Math.abs(tx.amount).toFixed(4)} SOL
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              tx.status === "success"
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {tx.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://solscan.io/tx/${tx.signature}`,
                                "_blank"
                              )
                            }
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "trading" && (
            <div className="space-y-6">
              <Card className="p-6">
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="_action" value="updateSettings" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Auto Trading</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically execute trades based on influencer signals
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="autoTrading"
                        id="autoTrading"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked={user.autoTrading}
                        value="true"
                      />
                      <label htmlFor="autoTrading" className="text-sm font-medium">
                        Enable
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">
                        Trade Amount (SOL)
                      </label>
                      <input
                        type="number"
                        name="tradeAmount"
                        step="0.001"
                        min="0.001"
                        defaultValue={user.tradeAmount}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="0.001"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Max Slippage (%)
                      </label>
                      <input
                        type="number"
                        name="maxSlippage"
                        step="0.1"
                        min="0.1"
                        defaultValue={user.maxSlippage}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Stop Loss (%)
                      </label>
                      <input
                        type="number"
                        name="stopLoss"
                        step="0.1"
                        min="0"
                        defaultValue={user.stopLoss}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Take Profit (%)
                      </label>
                      <input
                        type="number"
                        name="takeProfit"
                        step="0.1"
                        min="0"
                        defaultValue={user.takeProfit}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save Settings</Button>
                  </div>
                </Form>
              </Card>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Security Notice</h3>
                    <p className="mt-1 text-muted-foreground">
                      Your wallet security is managed by {publicKey
                        ? shortenAddress(publicKey.toBase58())
                        : "your wallet"}
                      . Please use your wallet's native interface for backup and
                      security features.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold">Best Practices</h3>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  <li>• Never share your seed phrase or private keys</li>
                  <li>• Store backup information offline</li>
                  <li>• Use a hardware wallet for large amounts</li>
                  <li>• Verify all transaction details before signing</li>
                  <li>
                    • Be cautious of phishing attempts and unofficial websites
                  </li>
                </ul>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Card className="p-6">
          <div className="text-center">
            <IconWallet className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Connect Your Wallet</h2>
            <p className="mt-2 text-muted-foreground">
              Connect your Solana wallet to view your balance and transactions
            </p>
            <div className="mt-6">
              <WalletMultiButton />
            </div>
          </div>
        </Card>
      )}

      {/* Security Warning */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <IconShieldLock className="h-5 w-5" />
          <p className="text-sm font-medium">Important Security Notice</p>
        </div>
        <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
          Never share your seed phrase or private key. Store them securely offline.
          TredSmart will never ask for this information.
        </p>
      </div>
    </div>
  )
}
