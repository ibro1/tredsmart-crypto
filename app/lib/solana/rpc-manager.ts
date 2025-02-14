import { Connection } from "@solana/web3.js"
import { retry } from "~/utils/retry"

export class RPCManager {
  private static endpoints: string[] = []
  private static currentIndex = 0
  private static readonly DEFAULT_ENDPOINTS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana",
  ]

  static initialize(mainEndpoint?: string) {
    this.endpoints = [
      ...this.validateEndpoints([mainEndpoint]),
      ...this.DEFAULT_ENDPOINTS,
    ].filter(Boolean)

    if (this.endpoints.length === 0) {
      this.endpoints = [...this.DEFAULT_ENDPOINTS]
    }
  }

  private static validateEndpoints(endpoints: (string | undefined)[]): string[] {
    return endpoints.filter((endpoint): endpoint is string => {
      if (!endpoint) return false
      try {
        const url = new URL(endpoint)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        console.warn(`Invalid RPC endpoint: ${endpoint}`)
        return false
      }
    })
  }

  static getCurrentEndpoint(): string {
    if (this.endpoints.length === 0) {
      this.initialize()
    }
    return this.endpoints[this.currentIndex]
  }

  static rotateEndpoint() {
    this.currentIndex = (this.currentIndex + 1) % this.endpoints.length
    return this.getCurrentEndpoint()
  }

  static async createConnection(): Promise<Connection> {
    const endpoint = this.getCurrentEndpoint()
    const connection = new Connection(endpoint, "confirmed")

    try {
      await retry(
        async () => {
          await connection.getLatestBlockhash()
        },
        {
          retries: 2,
          delay: 1000,
          onRetry: (attempt, error) => {
            if (error.message.includes("429")) {
              this.rotateEndpoint()
            }
            console.warn(`RPC attempt ${attempt} failed, rotating to ${this.getCurrentEndpoint()}`)
          },
        }
      )
      return connection
    } catch (error) {
      console.error("All RPC endpoints failed", error)
      throw error
    }
  }
}
