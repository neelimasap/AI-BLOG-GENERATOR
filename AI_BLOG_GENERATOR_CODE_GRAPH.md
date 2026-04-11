# AI-BLOG GENERATOR Code Graph

## Overview

This repository is a Next.js app with a single workspace flow for generating blog content.

- `src/app/page.tsx` — dashboard showing existing projects.
- `src/app/projects/new/page.tsx` — project creation form.
- `src/app/projects/[id]/page.tsx` — workspace shell with research, outline, draft, and image tabs.
- `src/hooks/useWorkflowStore.ts` — global client state for the workspace.
- `src/components/workspace/*` — UI pages for each stage.
- `src/app/api/*` — server routes for research, outline, draft, image, scraping, and persistence.
- `src/lib/ai/*` — AI wrappers for Claude, Groq, Fal.ai.
- `src/lib/research/*` — search and scraping helper implementations.

## Workflow graph

```mermaid
flowchart TD
  subgraph UI
    A[TopicInput] -->|POST /api/projects| B[Project API]
    C[ResearchPanel] -->|POST /api/research/exa| D[Exa API]
    C -->|POST /api/research/serp| E[Serp API]
    C -->|POST /api/scrape| F[Firecrawl API]
    G[OutlineEditor] -->|POST /api/outline| H[Groq API]
    I[DraftEditor] -->|POST /api/draft| J[Claude API]
    I -->|PATCH /api/projects/:id/drafts/:draftId| K[Draft persistence]
    L[ImageGallery] -->|POST /api/image| M[Fal.ai API]
  end

  subgraph Server
    B -->|Supabase| S[Supabase projects]
    K -->|Supabase| T[Supabase drafts]
    M -->|Supabase| U[Supabase generated_images]
    D -->|Exa SDK| W[Exa]
    E -->|HTTP| X[SerpAPI]
    F -->|Firecrawl SDK| Y[Firecrawl]
    H -->|Groq SDK| Z[Groq]
    J -->|Anthropic SDK| AA[Claude]
    M -->|Fal client| AB[Fal.ai]
  end

  A --> C
  C --> G
  G --> I
  I --> L
  C -->|stores results| ZStore[useWorkflowStore]
  G --> ZStore
  I --> ZStore
  L --> ZStore
``` 

## Key files

- `src/components/workspace/TopicInput.tsx`
- `src/components/workspace/ResearchPanel.tsx`
- `src/components/workspace/OutlineEditor.tsx`
- `src/components/workspace/DraftEditor.tsx`
- `src/components/workspace/ImageGallery.tsx`
- `src/hooks/useResearch.ts`
- `src/hooks/useOutline.ts`
- `src/hooks/useDraft.ts`
- `src/hooks/useImageGeneration.ts`
- `src/lib/ai/anthropic.ts`
- `src/lib/ai/groq.ts`
- `src/lib/ai/fal.ts`
- `src/lib/research/exa.ts`
- `src/lib/research/serp.ts`
- `src/lib/research/firecrawl.ts`
- `src/app/api/research/exa/route.ts`
- `src/app/api/research/serp/route.ts`
- `src/app/api/scrape/route.ts`
- `src/app/api/outline/route.ts`
- `src/app/api/draft/route.ts`
- `src/app/api/image/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/drafts/route.ts`
- `src/app/api/projects/[id]/drafts/[draftId]/route.ts`

## Notes

- The workspace uses a single Zustand store to carry state between tabs.
- Outline and draft generation are streamed back to the client.
- Image generation stores results in Supabase and allows markdown insertion.
- Research uses both Exa and Google SERP, with optional scraping of full content.
