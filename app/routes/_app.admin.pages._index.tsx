import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

import { IconSet } from "~/components/libs/icon-set"
import { FormActionItemNew } from "~/components/shared/form-action-item"
import { FormDelete } from "~/components/shared/form-delete"
import { PageItemAction } from "~/components/shared/page-item-action"
import {
  getPaginationConfigs,
  getPaginationOptions,
  PaginationNavigation,
  PaginationSearch,
} from "~/components/shared/pagination-search"
import { ButtonLink } from "~/components/ui/button-link"
import { getActionItem } from "~/configs/action-item"
import { db } from "~/libs/db.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"

export const handle = createSitemap()

export const meta: MetaFunction = () =>
  createMeta({
    title: `Admin Pages`,
    description: `Manage pages`,
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const config = getPaginationConfigs({ request })
  const contains = config.queryParam

  const where = !contains
    ? {}
    : {
        OR: [{ title: { contains } }, { slug: { contains } }],
      }

  const [totalItems, pages] = await db.$transaction([
    db.page.count({ where }),
    db.page.findMany({
      where,
      skip: config.skip,
      take: config.limitParam,
      orderBy: { updatedAt: "desc" },
      include: {
        status: { select: { symbol: true, name: true } },
      },
    }),
  ])

  return json({
    pages,
    ...getPaginationOptions({ request, totalItems }),
  })
}

export default function UserPagesRoute() {
  const { pages, ...loaderData } = useLoaderData<typeof loader>()

  return (
    <div className="app-container">
      <header className="app-header justify-between gap-4">
        <h2>Pages</h2>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <FormActionItemNew item={getActionItem("Page")} />
          <ButtonLink to="/pages" variant="outline" size="xs">
            <IconSet.ArrowSquareOut />
            <span>View Pages</span>
          </ButtonLink>
          <FormDelete
            action="/admin/pages/delete"
            intentValue="admin-delete-all-pages"
            itemText="all pages"
            buttonText="Delete Pages"
            disabled={pages.length <= 0}
          />
        </div>
      </header>

      <section className="app-section">
        <PaginationSearch
          itemName="page"
          searchPlaceholder="Search pages with keyword..."
          count={pages.length}
          {...loaderData}
        />
      </section>

      <section className="app-section">
        {pages.length > 0 && (
          <ul className="divide-y">
            {pages.map(page => (
              <PageItemAction key={page.id} page={page} />
            ))}
          </ul>
        )}
      </section>

      <section className="app-section">
        <PaginationNavigation {...loaderData} />
      </section>
    </div>
  )
}
