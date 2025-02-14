import { type MetaFunction } from "@remix-run/node"
import { Link } from "@remix-run/react"
import {
  IconBook,
  IconHeadset,
  IconMail,
  IconMessages,
  IconQuestionMark,
} from "@tabler/icons-react"

export const meta: MetaFunction = () => {
  return [{ title: "Support - TredSmarter" }]
}

const supportOptions = [
  {
    icon: IconBook,
    title: "Documentation",
    description: "Explore our comprehensive guides and documentation.",
    link: "/docs",
    linkText: "View Documentation",
  },
  {
    icon: IconQuestionMark,
    title: "FAQ",
    description: "Find answers to commonly asked questions.",
    link: "/faq",
    linkText: "Browse FAQ",
  },
  {
    icon: IconMessages,
    title: "Community",
    description: "Join our community for discussions and updates.",
    link: "https://discord.gg/tredsmarter",
    linkText: "Join Discord",
    external: true,
  },
  {
    icon: IconHeadset,
    title: "Live Chat",
    description: "Chat with our support team in real-time.",
    link: "#chat",
    linkText: "Start Chat",
    action: "openChat",
  },
]

const commonIssues = [
  {
    category: "Account",
    issues: [
      "Reset password",
      "Two-factor authentication",
      "Account verification",
      "Update profile",
    ],
  },
  {
    category: "Trading",
    issues: [
      "Order types explained",
      "Trading fees",
      "Position management",
      "Risk controls",
    ],
  },
  {
    category: "Wallet",
    issues: [
      "Connect wallet",
      "Supported networks",
      "Transaction issues",
      "Security settings",
    ],
  },
  {
    category: "Platform",
    issues: [
      "System status",
      "API access",
      "Feature requests",
      "Bug reports",
    ],
  },
]

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">
          How Can We Help You?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Our support team is here to help you with any questions or issues you may
          have.
        </p>
      </div>

      {/* Contact Form */}
      <div className="mb-16">
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-bold">Contact Support</h2>
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800"
                placeholder="What's your issue about?"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Describe your issue in detail"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary-500 px-6 py-3 text-white transition-colors hover:bg-primary-600"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Support Options */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Other Ways to Get Help
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {supportOptions.map((option, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900"
            >
              <option.icon className="mx-auto mb-4 h-8 w-8 text-primary-500" />
              <h3 className="mb-2 text-xl font-semibold">{option.title}</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
              {option.external ? (
                <a
                  href={option.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {option.linkText} →
                </a>
              ) : (
                <Link
                  to={option.link}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {option.linkText} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div>
        <h2 className="mb-8 text-center text-3xl font-bold">Common Issues</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {commonIssues.map((category, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <h3 className="mb-4 text-xl font-semibold">{category.category}</h3>
              <ul className="space-y-2">
                {category.issues.map((issue, issueIndex) => (
                  <li key={issueIndex}>
                    <Link
                      to={`/docs/search?q=${encodeURIComponent(issue)}`}
                      className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                    >
                      {issue}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
