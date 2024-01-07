import { Link, Outlet } from "@remix-run/react"

import { Iconify } from "~/components/libs/iconify"
import { SidebarNavItems } from "~/components/shared/sidebar-nav-items"
import { AnchorText } from "~/components/ui/anchor-text"
import { Card } from "~/components/ui/card"
import { configExamples } from "~/configs/examples"

export default function ExamplesRoute() {
  return (
    <div className="site-container space-y-12 pt-4">
      <header>
        <h1 className="inline-flex items-center gap-2 text-primary">
          <Iconify icon="ph:bounding-box-duotone" />
          <Link to="/examples">Examples</Link>
        </h1>
        <p>
          Most examples and explanation of the components are available on{" "}
          <AnchorText href="https://ui.shadcn.com">shadcn UI</AnchorText>
        </p>
      </header>

      <section className="flex flex-nowrap gap-4">
        <SidebarNavItems items={configExamples} />

        <Card className="flex-1 p-4">
          <Outlet />
        </Card>
      </section>
    </div>
  )
}
