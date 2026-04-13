# CLAUDE.md

## SESSION START — DO THIS FIRST, EVERY TIME
1. Read `tasks/lessons.md` — mandatory, apply every rule
2. Identify task complexity — 3+ steps = use planner agent before any code
3. Check existing code with grep/glob before building anything new
4. After writing any new file: run code-reviewer agent
5. Root cause first — never patch symptoms

## Skills to Use (Already Installed)
- New feature (3+ steps): `/subagent-driven-development` — spec → implement → review in parallel
- Debugging: `/systematic-debugging` — root-cause tracing before any fix
- After writing code: `/requesting-code-review` — always
- Before marking done: `/verification-before-completion` — prove it works
- Parallel tasks: `/dispatching-parallel-agents` — scraping, SEO, image in parallel
- New API route: `/tdd-workflow` — tests first

## Known Hard Rules for This Project
- Exa: ALWAYS `useAutoprompt: false`, `type: 'keyword'` — autoprompt returns completely wrong topics
- Groq: free tier 100k tokens/day — do NOT use for large-context calls; use Claude Haiku instead
- Supabase URL: must end in `.supabase.co` not `.supabase.co`
- Optional URL fields in Zod: use `.optional().or(z.literal(''))` — empty string fails `.url()`
- Delete `.next/` when app won't load — stale cache causes cryptic errors
- image_url: always pass `undefined` not `''` when empty

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
