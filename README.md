# Crypto Influencer Tracker

A real-time cryptocurrency influencer tracking platform built with Remix.js that helps traders monitor and act on Twitter influencers' cryptocurrency recommendations.

## Features

- Real-time Twitter influencer monitoring
- AI-powered tweet analysis
- Automated token identification
- Real-time trading capabilities via Helius RPC
- Live updates using Server-Sent Events (SSE)
- User authentication and profile management

## Tech Stack

- **Framework**: Remix.js
- **Styling**: Tailwind CSS
- **Database**: Prisma with PostgreSQL
- **Authentication**: Remix Auth
- **Routing**: remix-flat-routes
- **APIs**:
  - Twitter API (via RapidAPI)
  - OpenAI-compatible endpoint
  - Helius RPC
- **Real-time**: Server-Sent Events (SSE)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- RapidAPI Key (for Twitter API)
- OpenAI API Key
- Helius RPC URL

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Update .env with your credentials:
```env
DATABASE_URL="postgresql://..."
SESSION_SECRET="your-session-secret"
TWITTER_API_KEY="your-rapidapi-key"
OPENAI_API_KEY="your-openai-key"
HELIUS_RPC_URL="your-helius-url"
```

5. Initialize the database
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server
```bash
npm run dev
```

## Documentation

- [Product Requirements Document](./docs/PRD.md)
- [API Documentation](./docs/API.md)
- [Database Guide](./docs/GUIDE_DATABASE.md)
- [Codebase Guide](./docs/GUIDE_CODEBASE.md)

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.