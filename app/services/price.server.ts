import axios from 'axios'
import { logger } from '~/utils/logger.server'

const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price'
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

interface JupiterPriceResponse {
  data: {
    id: string
    mintSymbol: string
    vsToken: string
    vsTokenSymbol: string
    price: number
  }
}

/**
 * Get token price in SOL using Jupiter Price API
 * Falls back to CoinGecko if Jupiter fails
 */
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  try {
    // Try Jupiter first
    const { data } = await axios.get<JupiterPriceResponse>(
      `${JUPITER_PRICE_API}?ids=${tokenAddress}`
    )

    if (data?.data?.price) {
      logger.debug('Got price from Jupiter', {
        token: tokenAddress,
        price: data.data.price,
      })
      return data.data.price
    }

    // Fallback to CoinGecko
    // Note: This requires mapping Solana token addresses to CoinGecko IDs
    // For now, we'll just log that we need this mapping
    logger.warn('No Jupiter price, need CoinGecko mapping', {
      token: tokenAddress,
    })

    // Return 0 for now
    // TODO: Implement CoinGecko fallback once we have token mapping
    return 0
  } catch (error) {
    logger.error('Failed to get token price', {
      token: tokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 0
  }
}
