import Queue from "bull"
import { createBullBoard } from "@bull-board/api"
import { BullAdapter } from "@bull-board/api/bullAdapter.js"
import { ExpressAdapter } from "@bull-board/express"
import { parsedEnv } from "~/utils/env.server"


// Create queues with Docker Redis service
export const tweetQueue = new Queue("tweet-processing", {
  redis: {
    host: parsedEnv.NODE_ENV === "production" ? "redis" : "localhost",
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
  },
})

// Setup Bull Board
export const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullAdapter(tweetQueue)],
  serverAdapter,
})

serverAdapter.setBasePath("/admin/queues")

// Export queue instance
export { Queue }
