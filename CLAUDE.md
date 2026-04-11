# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- Next.js 14, App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui
- Anthropic Claude (`claude-opus-4-6`) — draft writing, streaming
- Groq (`llama-3.3-70b-versatile`) — outline generation, streaming
- Exa — semantic search research
- SerpAPI — Google search results (direct HTTP, no SDK)
- Firecrawl (`@mendable/firecrawl-js`) — web scraping
- Fal.ai (`@fal-ai/serverless-client`, model: `fal-ai/flux/schnell`) — image generation
- Supabase — projects, drafts, generated_images tables
- Zustand — client-side workflow state

## Commands

- Dev: `npm.cmd run dev` (port 3000)
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint src/`

## Architecture

```
src/lib/        — pure functions, external client wrappers, prompts, validators
src/hooks/      — React hooks: call API routes, update Zustand store
src/app/api/    — Next.js route handlers (one concern per file)
src/components/ — UI only; workspace/ for the 4-step flow, dashboard/ for listing
```

Single source of truth for all types: `src/lib/types.ts`

## Data Flow

```
TopicInput → create Supabase project → useWorkflowStore (Zustand)
  → useResearch  → POST /api/research/exa + /serp  → ResearchPanel
  → useOutline   → POST /api/outline (stream)       → OutlineEditor
  → useDraft     → POST /api/draft   (stream)       → DraftEditor (auto-saves every 30s)
  → useImageGeneration → POST /api/image            → ImageGallery
```

## Key Conventions

- All external SDK calls go through `src/lib/` wrappers — never call SDKs from hooks or components
- Streaming routes return `ReadableStream` with `text/event-stream`; client reads via `response.body.getReader()`
- All Zustand updates use immutable spread — never mutate state directly
- API route errors: always `NextResponse.json({ error })` with correct status — never 200 on failure
- `src/lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS); browser client uses anon key
- All API route inputs validated with Zod schemas in `src/lib/validators/schema.ts`
- All route handlers have `export const runtime = 'nodejs'`

## Required Environment Variables

```
ANTHROPIC_API_KEY
GROQ_API_KEY
EXA_API_KEY
SERP_API_KEY
FIRECRAWL_API_KEY
FAL_KEY                          # format: key_id:key_secret
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Schema

Tables: `projects`, `drafts`, `generated_images` — see architect blueprint for full SQL.
Run schema SQL in Supabase SQL editor before first use.
`projects.research_summary` and `projects.outline` store JSON as text.

## File Size Rule

Keep files under 300 lines. Extract to sub-modules when approaching limit.
