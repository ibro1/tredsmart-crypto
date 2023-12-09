import { ExampleButton } from "~/components/examples/button"
import { ExampleDatePicker } from "~/components/examples/date-picker"

export default function ComponentIndexRoute() {
  return (
    <div className="space-y-8">
      <ExampleButton />
      <ExampleDatePicker />
    </div>
  )
}
