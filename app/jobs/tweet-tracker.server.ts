import { trackAllInfluencers } from "~/services/tweet-tracker.server"

let isRunning = false
const TRACKING_INTERVAL = 60 * 1000 // 1 minute

export async function startTweetTracking() {
  if (isRunning) return

  isRunning = true
  console.log("Starting tweet tracking job...")

  setInterval(async () => {
    try {
      await trackAllInfluencers()
    } catch (error) {
      console.error("Error in tweet tracking job:", error)
    }
  }, TRACKING_INTERVAL)
}
