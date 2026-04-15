import { NextResponse } from 'next/server';
import { GenerateRequestSchema } from '@/lib/validators/schema';
import {
  generateDraftWithFallback,
  generateOutlineWithFallback,
} from '@/lib/ai/generateWithFallback';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { topic, audience, tone, research_sources } = parsed.data;

    // Filter sources to only those relevant to the topic
    const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const relevantSources = research_sources.filter(s => {
      const text = `${s.title} ${s.snippet}`.toLowerCase();
      const matches = topicWords.filter(w => text.includes(w)).length;
      return matches >= Math.max(1, Math.floor(topicWords.length * 0.3));
    });
    const sources = relevantSources.length >= 2 ? relevantSources : research_sources;

    const researchSummary = sources
      .map(s => `${s.title}\n${s.content || s.snippet}`)
      .join('\n\n---\n\n');

    const { provider: outlineProvider, outline } = await generateOutlineWithFallback(
      topic,
      audience,
      tone,
      researchSummary,
    );
    outline.title = outline.title || topic;

    const researchContext = sources
      .map(s => `## ${s.title}\n${s.content || s.snippet}`)
      .join('\n\n')
      .slice(0, 4000);

    const { provider: draftProvider, draft } = await generateDraftWithFallback(
      outline,
      researchContext,
      tone,
      150,
    );

    console.info('Generate route providers', { outlineProvider, draftProvider });

    return NextResponse.json(draft);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
