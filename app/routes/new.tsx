import { type ActionFunctionArgs } from "@remix-run/node"
import { FormActionItem } from "~/components/shared/form-action-item"
import { configActionItems } from "~/configs/action-item"
import { createSitemap } from "~/utils/sitemap"

export const handle = createSitemap()

/**
 * New Anything:
 * - User, Organization, Group, Role, Permission
 * - Post, Tag, Category
 * - Program, Mentor, Mentee
 * - Client, Project
 * - Event, Venue, Attendee
 * - Job
 */
export default function NewRoute() {
  return (
    <div className="app-container pb-20">
      <header className="app-header mx-auto max-w-prose text-center">
        <h1 className="text-2xl sm:text-3xl">Add New</h1>
        <p>Add various new data</p>
      </header>

      <section className="mx-auto max-w-prose">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {configActionItems.map(item => (
            <li key={item.actionNew}>
              <FormActionItem item={item} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export const action = ({}: ActionFunctionArgs) => {
  return null
}
