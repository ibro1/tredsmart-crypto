import { ContentCredits } from "~/components/contents/credits"
import { ContentIntro } from "~/components/contents/intro"
import { ContentStack } from "~/components/contents/stack"
import { ContentStart } from "~/components/contents/start"

export default function IndexRoute() {
  return (
    <div className="site-container space-y-10">
      <section className="site-section">
        <ContentIntro />
      </section>

      <section className="site-section">
        <ContentStack />
      </section>

      <section className="site-section">
        <ContentStart />
      </section>

      <section className="site-section">
        <ContentCredits />
      </section>
    </div>
  )
}
