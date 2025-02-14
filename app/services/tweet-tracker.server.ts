import axios from "axios"
import OpenAI from "openai"
import { db } from "~/libs/db.server"
import { emit } from "./sse.server"
import { parsedEnv } from "~/utils/env.server"

const TWEET_MAX_TIME_MS = 1 * 60 * 1000 // 1 minute

// Configure OpenAI SDK to use DeepSeek API
const openai = new OpenAI({
  baseURL: parsedEnv.OPENAI_COMPATIBLE_URL || 'https://api.deepseek.com/v1',
  apiKey: parsedEnv.OPENAI_COMPATIBLE_KEY,
})

async function getTweets(username: string) {
  const config = {
    method: "get",
    url: `https://twttrapi.p.rapidapi.com/user-tweets?username=${username}`,
    headers: {
      "x-rapidapi-host": "twttrapi.p.rapidapi.com",
      "x-rapidapi-key": parsedEnv.RAPID_API_KEY,
    },
  }

  const response = await axios.request(config)
  const timelineResponse = response.data.data.user_result.result.timeline_response
    .timeline.instructions.filter((x: any) => x.__typename === "TimelineAddEntries")

  const tweets: Array<{
    content: string
    id: string
    createdAt: string
  }> = []

  timelineResponse[0].entries.map((x: any) => {
    try {
      tweets.push({
        content:
          x.content.content.tweetResult.result.legacy.full_text ??
          x.content.content.tweetResult.result.core.user_result.result.legacy
            .description,
        id: x.content.content.tweetResult.result.core.user_result.result.legacy
          .id_str,
        createdAt: x.content.content.tweetResult.result.legacy.created_at,
      })
    } catch (e) {
      console.error("Error parsing tweet:", e)
    }
  })

  return tweets.filter(
    (x) => new Date(x.createdAt).getTime() > Date.now() - TWEET_MAX_TIME_MS
  )
}

async function getTokenFromLLM(content: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an AI agent that needs to tell me if this tweet is about buying a token. Return me either the address of the solana token, or return me null if you cant find a solana token address in this tweet. Only return if it says it is a bull post. The token address will be very visible in the tweet.",
        },
        { role: "user", content },
      ],
    })

    const result = completion.choices[0].message.content
    return result === "null" ? null : result
  } catch (error) {
    console.error("Error getting token from LLM:", error)
    return null
  }
}

export async function trackInfluencerTweets(influencerId: string) {
  try {
    // Get influencer
    const influencer = await db.influencer.findUnique({
      where: { id: influencerId },
    })

    if (!influencer) {
      throw new Error("Influencer not found")
    }

    // Get recent tweets
    const tweets = await getTweets(influencer.username)

    // Process each tweet
    for (const tweet of tweets) {
      // Check if tweet already exists
      const existingTweet = await db.tweet.findUnique({
        where: { tweetId: tweet.id },
      })

      if (existingTweet) continue

      // Create new tweet
      const newTweet = await db.tweet.create({
        data: {
          tweetId: tweet.id,
          content: tweet.content,
          postedAt: new Date(tweet.createdAt),
          influencerId: influencer.id,
        },
      })

      // Check for token address
      const tokenAddress = await getTokenFromLLM(tweet.content)

      if (tokenAddress) {
        // Create token signal
        const signal = await db.tokenSignal.create({
          data: {
            tokenAddress,
            tweetId: newTweet.id,
          },
          include: {
            tweet: {
              include: {
                influencer: true,
              },
            },
          },
        })

        // Emit new signal event
        emit("new-signal", signal)
      }
    }
  } catch (error) {
    console.error("Error tracking influencer tweets:", error)
    throw error
  }
}

export async function trackAllInfluencers() {
  const influencers = await db.influencer.findMany()
  
  for (const influencer of influencers) {
    try {
      await trackInfluencerTweets(influencer.id)
    } catch (error) {
      console.error(
        `Error tracking tweets for influencer ${influencer.username}:`,
        error
      )
    }
  }
}
