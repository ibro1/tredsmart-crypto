import { tweetQueue } from "./config.server"
import { trackInfluencerTweets } from "~/services/tweet-tracker.server"
import { executeSwap } from "~/services/swap.server"
import { db } from "~/libs/db.server"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"

const SOL_AMOUNT = 0.001 * LAMPORTS_PER_SOL

// Process tweets for each influencer
tweetQueue.process(async (job) => {
  const influencers = await db.influencer.findMany()
  
  for (const influencer of influencers) {
    try {
      await trackInfluencerTweets(influencer.id)

      // Get pending signals and execute trades
      const pendingSignals = await db.tokenSignal.findMany({
        where: {
          tweet: {
            influencerId: influencer.id
          },
          status: "pending"
        }
      })

      for (const signal of pendingSignals) {
        try {
          await executeSwap(signal.id)
        } catch (error) {
          console.error(
            `Error executing trade for signal ${signal.id}:`,
            error
          )
        }
      }
    } catch (error) {
      console.error(
        `Error processing tweets for influencer ${influencer.username}:`,
        error
      )
    }
  }
})

// Add recurring job to process tweets
tweetQueue.add(
  {},
  {
    repeat: {
      every: 60000, // Every minute
    },
  }
)

export { tweetQueue }
