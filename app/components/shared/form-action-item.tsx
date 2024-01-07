import { useFetcher } from "@remix-run/react"

import { IconSet } from "~/components/libs/icon-set"
import { Iconify } from "~/components/libs/iconify"
import { ButtonLink } from "~/components/ui/button-link"
import { ButtonLoading } from "~/components/ui/button-loading"
import { Card } from "~/components/ui/card"
import { type ConfigActionItem } from "~/configs/action-item"
import { cn } from "~/utils/cn"

export function FormActionItem({ item }: { item: ConfigActionItem }) {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state === "submitting"
  const isDisabled = item.isEnabled !== true

  return (
    <Card className="p-2">
      <fetcher.Form method="POST" action={item.actionNew} className="w-full">
        <fieldset
          disabled={isDisabled}
          className="flex flex-col items-center gap-2"
        >
          <div
            className={cn(
              "text-6xl text-primary",
              isDisabled && "text-muted-foreground",
            )}
          >
            <Iconify icon={item.icon} />
          </div>

          <h4 className={cn(isDisabled && "text-muted-foreground")}>
            {item.name}
          </h4>

          <div className="grid w-full grid-rows-2 gap-2">
            <ButtonLoading
              disabled={isDisabled}
              size="sm"
              loadingText="Adding"
              isLoading={isSubmitting}
            >
              <IconSet.Plus />
              <span>Add</span>
            </ButtonLoading>

            <ButtonLink
              to={item.actionManage}
              disabled={isDisabled}
              size="sm"
              variant="secondary"
            >
              <Iconify icon="ph:folder-simple-duotone" />
              <span>Manage</span>
            </ButtonLink>
          </div>
        </fieldset>
      </fetcher.Form>
    </Card>
  )
}

export function FormActionItemNew({ item }: { item?: ConfigActionItem }) {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state === "submitting"

  if (!item) return null

  return (
    <fetcher.Form method="POST" action={item.actionNew}>
      <ButtonLoading
        variant="outline"
        size="xs"
        loadingText="Adding"
        isLoading={isSubmitting}
        disabled={isSubmitting}
      >
        <IconSet.Plus />
        <span>Add {item.name}</span>
      </ButtonLoading>
    </fetcher.Form>
  )
}
