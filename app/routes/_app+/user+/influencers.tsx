import { json, type ActionFunctionArgs, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData, useNavigation } from "@remix-run/react"
import { useState } from "react"
import { IconPlus, IconTrash, IconBrandTwitter } from "@tabler/icons-react"
import axios from "axios"

import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { requireUser } from "~/helpers/auth"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { db } from "~/libs/db.server"
import { parsedEnv } from "~/utils/env.server"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `Influencer Tracking - TredSmart`,
    description: `Track crypto influencers and their trading signals`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await requireUser(request)
  
  const influencers = await db.influencer.findMany({
    where: {
      users: {
        some: {
          id: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return json({ user, influencers })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { user } = await requireUser(request)
  const formData = await request.formData()
  const username = formData.get("username")?.toString()
  const action = formData.get("_action")?.toString()

  if (!username) {
    return json({ error: "Username is required" }, { status: 400 })
  }

  if (action === "add") {
    try {
      // Get user details from Twitter API
      const config = {
        method: "get",
        url: `https://twttrapi.p.rapidapi.com/get-user?username=${username}`,
        headers: {
          "x-rapidapi-host": "twttrapi.p.rapidapi.com",
          "x-rapidapi-key": parsedEnv.RAPID_API_KEY,
        },
      }

      const response = await axios.request(config)
      const userData = response.data

      // Create or update influencer
      const influencer = await db.influencer.upsert({
        where: { username: userData.screen_name.toLowerCase() },
        create: {
          username: userData.screen_name.toLowerCase(),
          name: userData.name,
          description: userData.description,
          profileImage: userData.profile_image_url_https,
          followersCount: userData.followers_count,
          tweetsCount: userData.statuses_count,
          users: {
            connect: { id: user.id },
          },
        },
        update: {
          name: userData.name,
          description: userData.description,
          profileImage: userData.profile_image_url_https,
          followersCount: userData.followers_count,
          tweetsCount: userData.statuses_count,
          users: {
            connect: { id: user.id },
          },
        },
      })

      return json({ success: true, influencer })
    } catch (error) {
      console.error("Error adding influencer:", error)
      return json(
        { error: "Failed to add influencer. Please try again." },
        { status: 500 }
      )
    }
  }

  if (action === "remove") {
    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          influencers: {
            disconnect: { username },
          },
        },
      })
      return json({ success: true })
    } catch (error) {
      console.error("Error removing influencer:", error)
      return json(
        { error: "Failed to remove influencer. Please try again." },
        { status: 500 }
      )
    }
  }

  return json({ error: "Invalid action" }, { status: 400 })
}

export default function InfluencersRoute() {
  const { user, influencers } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const [isOpen, setIsOpen] = useState(false)

  const isAdding = navigation.state === "submitting"

  return (
    <div className="app-container space-y-8">
      <header className="app-header items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Influencer Tracking</h1>
          <p className="text-muted-foreground">
            Monitor crypto influencers and their trading signals
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Influencer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Influencer</DialogTitle>
              <DialogDescription>
                Enter the Twitter username of the influencer you want to track
              </DialogDescription>
            </DialogHeader>

            <form
              method="post"
              className="mt-4 space-y-4"
              onSubmit={() => {
                if (!isAdding) {
                  setIsOpen(false)
                }
              }}
            >
              <input type="hidden" name="_action" value="add" />
              <div className="space-y-2">
                <Input
                  type="text"
                  name="username"
                  placeholder="Twitter username (without @)"
                  required
                  pattern="^[A-Za-z0-9_]{1,15}$"
                  title="Please enter a valid Twitter username"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Influencer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {influencers.map((influencer) => (
          <Card key={influencer.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {influencer.profileImage && (
                  <img
                    src={influencer.profileImage}
                    alt={influencer.name}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{influencer.name}</h3>
                  <a
                    href={`https://twitter.com/${influencer.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <IconBrandTwitter className="h-4 w-4" />@{influencer.username}
                  </a>
                </div>
              </div>

              <form method="post">
                <input type="hidden" name="_action" value="remove" />
                <input type="hidden" name="username" value={influencer.username} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {influencer.description}
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{influencer.followersCount.toLocaleString()} followers</span>
              <span>{influencer.tweetsCount.toLocaleString()} tweets</span>
            </div>
          </Card>
        ))}

        {influencers.length === 0 && (
          <Card className="col-span-full p-6">
            <div className="text-center">
              <IconBrandTwitter className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">No Influencers Yet</h2>
              <p className="mt-2 text-muted-foreground">
                Start tracking crypto influencers by clicking the "Add Influencer"
                button above
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
