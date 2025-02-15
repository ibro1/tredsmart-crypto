import { type MetaFunction } from "@remix-run/node"
import { Link } from "@remix-run/react"
import { IconChevronDown } from "@tabler/icons-react"
import { useState } from "react"

import { cn } from "~/utils/cn"

export const meta: MetaFunction = () => {
  return [{ title: "FAQ - TredSmarter" }]
}

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqItems: FAQItem[] = [
  {
    category: "General",
    question: "What is TredSmarter?",
    answer: "TredSmarter is a real-time cryptocurrency influencer tracking platform that monitors Twitter influencers' cryptocurrency recommendations and provides automated trading capabilities with advanced risk management features.",
  },
  {
    category: "General",
    question: "How does TredSmarter work?",
    answer: "TredSmarter uses advanced AI to monitor crypto influencers on Twitter, analyze their recommendations, and provide automated trading options. We track performance metrics, provide real-time alerts, and offer comprehensive risk management tools.",
  },
  {
    category: "Trading",
    question: "What trading features are available?",
    answer: "We offer multiple order types including market orders, limit orders, stop-loss, take-profit, and DCA options. Our platform includes position limits, allocation controls, and automated risk management features.",
  },
  {
    category: "Trading",
    question: "How do you manage risk?",
    answer: "Our platform includes comprehensive risk management features such as position limits, allocation controls, stop-loss automation, and exposure warnings. We also provide detailed analytics to help you make informed decisions.",
  },
  {
    category: "Security",
    question: "How secure is my account?",
    answer: "We implement industry-standard security measures including 2FA, IP whitelisting, and encrypted data storage. All trading actions require confirmation, and we provide detailed security settings for your account.",
  },
  {
    category: "Security",
    question: "How do you protect my wallet?",
    answer: "We support multiple wallet options including hardware wallets for maximum security. Your private keys are never stored on our servers, and all transactions require explicit authorization.",
  },
  {
    category: "Pricing",
    question: "What are your fees?",
    answer: "Our fee structure includes base fees for platform usage and success fees for profitable trades. We also provide gas estimation for transactions. Detailed fee information can be found in our fee structure documentation.",
  },
  {
    category: "Pricing",
    question: "Do you offer a free trial?",
    answer: "Yes, we offer a 14-day free trial with access to all features. This allows you to test our platform and see the value we provide before committing to a subscription.",
  },
]

function FAQItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-medium">{item.question}</span>
        <IconChevronDown
          className={cn(
            "h-5 w-5 transform transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <p className="pb-4 text-gray-600 dark:text-gray-400">{item.answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const categories = Array.from(new Set(faqItems.map((item) => item.category)))

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-center text-4xl font-bold">
          Frequently Asked Questions
        </h1>

        <div className="mb-8 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Can't find what you're looking for?{" "}
            <Link
              to="/support"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Contact our support team
            </Link>
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-4 text-2xl font-semibold">{category}</h2>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                {faqItems
                  .filter((item) => item.category === category)
                  .map((item, index) => (
                    <FAQItem key={index} item={item} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
