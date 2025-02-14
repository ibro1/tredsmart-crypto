import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { IconBrandTwitter, IconExternalLink } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { requireUser } from "~/helpers/auth"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { db } from "~/libs/db.server"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `Trading Signals - TredSmart`,
    description: `View and manage trading signals from tracked influencers`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await requireUser(request)

  const signals = await db.tokenSignal.findMany({
    where: {
      tweet: {
        influencer: {
          users: {
            some: {
              id: user.id,
            },
          },
        },
      },
    },
    include: {
      tweet: {
        include: {
          influencer: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return json({ user, signals })
}

export default function SignalsRoute() {
  const { signals: initialSignals } = useLoaderData<typeof loader>()
  const [signals, setSignals] = useState(initialSignals)

  useEffect(() => {
    const eventSource = new EventSource("/api/signals")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === "connected") {
        console.log("Connected to signal stream")
        return
      }

      setSignals((prevSignals) => {
        // Check if signal already exists
        const exists = prevSignals.some((s) => s.id === data.id)
        if (exists) return prevSignals

        // Add new signal at the beginning
        return [data, ...prevSignals]
      })
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <div className="app-container space-y-8">
      <header className="app-header items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trading Signals</h1>
          <p className="text-muted-foreground">
            View and manage trading signals from tracked influencers
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {signals.map((signal) => (
          <Card key={signal.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {signal.tweet.influencer.profileImage && (
                    <img
                      src={signal.tweet.influencer.profileImage}
                      alt={signal.tweet.influencer.name}
                      className="h-6 w-6 rounded-full"
                    />
                  )}
                  <span className="font-medium">
                    {signal.tweet.influencer.name}
                  </span>
                  <a
                    href={`https://twitter.com/${signal.tweet.influencer.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    @{signal.tweet.influencer.username}
                  </a>
                </div>

                <p className="text-sm text-muted-foreground">
                  {signal.tweet.content}
                </p>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      signal.status === "executed"
                        ? "success"
                        : signal.status === "failed"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {signal.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(signal.tweet.postedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <a
                    href={`https://twitter.com/${signal.tweet.influencer.username}/status/${signal.tweet.tweetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandTwitter className="h-4 w-4" />
                    View Tweet
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <a
                    href={`https://solscan.io/token/${signal.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconExternalLink className="h-4 w-4" />
                    View Token
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {signals.length === 0 && (
          <Card className="p-6">
            <div className="text-center">
              <IconBrandTwitter className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">No Signals Yet</h2>
              <p className="mt-2 text-muted-foreground">
                Start tracking influencers to receive trading signals
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
