import { useFetcher } from "@remix-run/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { ButtonLoading } from "~/components/ui/button-loading"
import { Iconify } from "~/components/ui/iconify"
import { type modelPage } from "~/models/page.server"
import { type modelPost } from "~/models/post.server"
import { type JsonifyPrisma } from "~/types/jsonify"

export function FormUpdatePublish({
  itemName = "Item",
  itemId = "itemId",
  action = "/user/items/update",
  intentValue = "update-item-publish",
  item,
}: {
  itemName: string
  itemId: string
  action: string // Example: /user/posts/update
  intentValue: string // Example: update-post-status
  item:
    | JsonifyPrisma<typeof modelPage.getWithStatus>
    | JsonifyPrisma<typeof modelPost.getWithStatus>
}) {
  const fetcher = useFetcher()
  const isLoading =
    fetcher.state !== "submitting" && fetcher.formMethod === "POST"

  if (!item) return null

  // IDEA: Move to props to be customizable
  const isPublished = item.status.symbol === "DRAFT" ? false : true
  const statusSymbol = isPublished ? "DRAFT" : "PUBLISHED"
  const dialogTrigger = isPublished ? `Unpublish` : `Publish`
  const dialogTitle = isPublished ? `Unpublish?` : `Publish?`
  const dialogDescription = isPublished
    ? `Unpublish "${itemName}" so people cannot see.`
    : `Publish "${itemName}" so people can see.`
  const dialogAction = isPublished ? `Unpublish` : `Publish`
  const dialogActionLoading = isPublished ? `Unpublishing` : `Publishing`

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <ButtonLoading
          type="button"
          variant="outline"
          size="xs"
          loadingText="Publishing"
          name="intent"
          value={intentValue}
          isLoading={isLoading}
          iconComponent={
            <Iconify
              icon={
                isPublished
                  ? "ph:book-open-duotone"
                  : "ph:book-open-text-duotone"
              }
            />
          }
        >
          <span>{dialogTrigger}</span>
        </ButtonLoading>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <fetcher.Form action={action} method="POST" className="space-y-2">
          <input type="hidden" name={itemId} defaultValue={item.id} />
          <input
            type="hidden"
            name="statusSymbol"
            defaultValue={statusSymbol}
          />
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <ButtonLoading
                type="submit"
                name="intent"
                value={intentValue}
                isLoading={isLoading}
                loadingText={dialogActionLoading}
              >
                {dialogAction}
              </ButtonLoading>
            </AlertDialogAction>
          </AlertDialogFooter>
        </fetcher.Form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
