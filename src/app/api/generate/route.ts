import { NextResponse } from 'next/server';
import { GenerateRequestSchema } from '@/lib/validators/schema';
import { streamDraft, streamOutlineWithClaude } from '@/lib/ai/anthropic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Step 1: Generate outline with Groq
    const researchSummary = sources
      .map(s => `${s.title}\n${s.content || s.snippet}`)
      .join('\n\n---\n\n');

    const outlineText = await streamOutlineWithClaude(topic, audience, tone, researchSummary);

    let outline;
    try {
      outline = JSON.parse(outlineText);
    } catch (e) {
      throw new Error('Failed to parse outline JSON');
    }

    // Force the outline title to match the user's topic if the model drifted
    outline.title = outline.title || topic;

    // Step 2: Generate full post with Claude using the outline and research
    const researchContext = sources
      .map(s => `## ${s.title}\n${s.content || s.snippet}`)
      .join('\n\n')
      .slice(0, 32000);

    const postStream = await streamDraft(outline, researchContext, tone, 1500);

    // For now, return the stream directly - frontend will handle JSON parsing
    return new Response(postStream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}