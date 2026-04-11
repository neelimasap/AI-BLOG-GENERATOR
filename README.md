# AI Blog Generator

A comprehensive AI-powered blog post generator that creates high-quality, SEO-optimized content using multiple AI services and research sources.

## Features

- 🤖 **AI-Powered Content Generation**: Uses Anthropic Claude for writing and Groq for outlining
- 🔍 **Multi-Source Research**: Combines Exa semantic search, SerpAPI Google results, and Firecrawl web scraping
- 🎨 **Image Generation**: Creates relevant images using Fal.ai
- 📊 **SEO Analysis**: Comprehensive SEO scoring and optimization recommendations
- 🎨 **Modern UI**: Built with Next.js 14, Tailwind CSS, and shadcn/ui
- 🗄️ **Database**: Supabase for data persistence with RLS security
- ✅ **Testing**: Comprehensive Jest test suite with 80%+ coverage

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **AI Services**: Anthropic Claude, Groq, Fal.ai
- **Research**: Exa, SerpAPI, Firecrawl
- **Database**: Supabase (PostgreSQL)
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- API keys for all AI services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-blog-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in all required environment variables (see Environment Variables section below).

4. **Set up Supabase**
   ```bash
   # Run the database migration
   npx supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# AI Service API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Research APIs
EXA_API_KEY=your_exa_api_key_here
SERP_API_KEY=your_serp_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Image Generation
FAL_KEY=your_fal_key_id:your_fal_key_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Getting API Keys

- **Anthropic Claude**: [anthropic.com](https://anthropic.com)
- **Groq**: [groq.com](https://groq.com)
- **Exa**: [exa.ai](https://exa.ai)
- **SerpAPI**: [serpapi.com](https://serpapi.com)
- **Firecrawl**: [firecrawl.dev](https://firecrawl.dev)
- **Fal.ai**: [fal.ai](https://fal.ai)
- **Supabase**: [supabase.com](https://supabase.com)

## Database Setup

The application uses Supabase for data persistence. The schema includes:

- `projects`: Blog generation projects
- `drafts`: Generated blog post drafts
- `generated_posts`: Final published posts

Run the migration to set up the database:

```bash
# Apply migrations
npx supabase db push

# Or run the SQL directly in Supabase dashboard
# See supabase/migrations/ for the schema
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── fonts/             # Font files
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── workspace/        # App-specific components
├── hooks/                # React hooks
├── lib/                  # Utility functions and clients
│   ├── ai/              # AI service clients
│   ├── research/        # Research service clients
│   └── supabase/        # Database clients
└── types/               # TypeScript type definitions
```

## Testing

The project includes comprehensive testing with Jest and React Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

Test coverage includes:
- API route logic
- Component rendering
- Error handling
- Integration flows

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod

   # Or deploy to preview
   vercel
   ```

3. **Configure Environment Variables**
   In the Vercel dashboard, add all environment variables from `.env.example`:
   - Go to Project Settings → Environment Variables
   - Add each variable with its production value

4. **Database Configuration**
   - Ensure Supabase project allows connections from Vercel's IP ranges
   - Update CORS settings if needed
   - Verify RLS policies are correctly configured

### Build Configuration

The `vercel.json` file configures:
- Next.js framework detection
- API route runtime (Node.js 18.x)
- Function timeout (30 seconds for AI processing)
- Build commands and output directory

## Architecture

### Data Flow

1. **Topic Input** → Create Supabase project
2. **Research Phase** → Exa + SerpAPI → Research results
3. **Outline Phase** → Groq API → Structured outline
4. **Draft Phase** → Anthropic Claude → Full blog post
5. **Image Phase** → Fal.ai → Generated images
6. **SEO Analysis** → Scoring and recommendations

### API Routes

- `POST /api/research` - Multi-source research
- `POST /api/generate` - Outline and draft generation
- `POST /api/image` - Image generation
- `POST /api/seo-check` - SEO analysis
- `GET/POST /api/projects` - Project management
- `GET/POST /api/posts` - Post management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions:
- Create an issue on GitHub
- Check the documentation
- Review the test cases for usage examples
