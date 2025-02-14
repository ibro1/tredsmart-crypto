export const isDevelopment = typeof process !== "undefined" && process.env.NODE_ENV === "development"
export const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production"

export interface EnvSchemaClient {
  NODE_ENV?: string
  APP_URL?: string
  RPC_URL?: string
  DEFAULT_TRADE_AMOUNT?: string
  SLIPPAGE_PERCENT?: string
}

declare global {
  interface Window {
    ENV: EnvSchemaClient
  }
}

export function getClientEnv(): EnvSchemaClient {
  if (typeof window === "undefined") return {}
  return window.ENV || {}
}
