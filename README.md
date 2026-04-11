# AI Blog Generator

A comprehensive AI-powered blog post generator that creates high-quality, SEO-optimized content using multiple AI services and research sources.

## Features

- AI-Powered Content Generation using Anthropic Claude for writing and Groq for outlining
- Multi-Source Research combining Exa semantic search, SerpAPI Google results, and Firecrawl web scraping
- Image Generation using Fal.ai for relevant visual content
- SEO Analysis with comprehensive scoring and optimization recommendations
- Modern UI built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui
- Database powered by Supabase with Row Level Security
- Full test coverage with Jest and React Testing Library

## Tech Stack

**Frontend**
- Next.js 16.2.3 (App Router)
- React 19.2.4
- TypeScript 6.0.2
- Tailwind CSS v4 with @tailwindcss/postcss
- shadcn/ui components

**Backend**
- Next.js API Routes
- Supabase (PostgreSQL)

**AI & Research**
- Anthropic Claude (@anthropic-ai/sdk)
- Groq (groq-sdk)
- Exa semantic search (exa-js)
- SerpAPI for web search
- Firecrawl for web scraping (@mendable/firecrawl-js)
- Fal.ai for image generation (@fal-ai/serverless-client)

**Tooling**
- Package manager: Bun (required)
- Build: Turbopack (enabled by default)
- Testing: Jest 30, React Testing Library
- Linting: ESLint 9 with eslint-config-next
- Deployment: Vercel

## Prerequisites

- Bun 1.0 or higher
- Supabase account
- API keys for AI services (see Environment Variables)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd ai-blog-generator
```

2. Install dependencies with Bun

```bash
bun install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys.

4. Set up the database

```bash
bunx supabase db push
```

5. Start the development server

```bash
bun run dev
```

Open http://localhost:3000 to view the application.

## Environment Variables

Create a `.env.local` file with these variables:

```
# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key

# Research APIs
EXA_API_KEY=your_exa_api_key
SERP_API_KEY=your_serp_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Image Generation
FAL_KEY=your_fal_key_id:your_fal_key_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## Database Setup

The application uses Supabase with the following tables:

- `projects` - Blog generation sessions
- `drafts` - Generated blog post drafts  
- `generated_posts` - Final published content

Apply migrations:

```bash
bunx supabase db push
```

All tables use Row Level Security (RLS). Ensure your Supabase project has appropriate policies configured.

## Development Scripts

```bash
# Development server with Turbopack
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run tests
bun run test

# Run tests with coverage
bun run test -- --coverage

# Lint code
bun run lint

# Type check
bunx tsc --noEmit
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── research/route.ts
│   │   ├── generate/route.ts
│   │   ├── image/route.ts
│   │   └── seo-check/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── workspace/
├── lib/
│   ├── ai/
│   ├── research/
│   ├── supabase/
│   └── validators/
├── hooks/
└── types/
```

## Testing

Run the test suite:

```bash
bun run test
```

Tests cover:
- API route handlers
- Component rendering and interaction
- Error handling
- Integration flows

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Project Settings → Environment Variables
3. Deploy:

```bash
vercel --prod
```

### Build Configuration

The `vercel.json` file configures:
- Next.js framework detection
- API route runtime settings
- Function timeouts (30s for AI processing)
- Build and install commands using Bun

## Architecture

### Data Flow

1. User submits topic and preferences
2. System creates a project record in Supabase
3. Research phase: Exa + SerpAPI + Firecrawl gather sources
4. Outline phase: Groq generates structured outline
5. Draft phase: Claude writes full blog post
6. Image phase: Fal.ai generates relevant images
7. SEO analysis: Content is scored and optimized
8. Result: Generated post returned to user

### API Routes

- `POST /api/research` - Multi-source research aggregation
- `POST /api/generate` - Outline and draft generation
- `POST /api/image` - Image generation via Fal.ai
- `POST /api/seo-check` - SEO analysis and scoring
- `GET/POST /api/projects` - Project management
- `GET/POST /api/posts` - Post management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all checks pass: `bun run lint && bun run test && bunx tsc --noEmit`
6. Submit a pull request

## License

MIT License. See LICENSE file for details.

## Support

- Report bugs: Create an issue on GitHub
- Questions: Check this README or review test cases
- API issues: Verify your keys and service dashboards
