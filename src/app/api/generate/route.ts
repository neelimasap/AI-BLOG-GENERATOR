import { NextResponse } from 'next/server';
import { GenerateRequestSchema } from '@/lib/validators/schema';
import { generateOutlineWithGemini } from '@/lib/ai/gemini';
import { streamOutlineWithClaude, generateDraftWithClaude } from '@/lib/ai/anthropic';

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

    // Step 1: Outline with Gemini Flash (fallback to Claude Haiku)
    let outlineText: string;
    try {
      outlineText = await generateOutlineWithGemini(topic, audience, tone, researchSummary);
    } catch {
      outlineText = await streamOutlineWithClaude(topic, audience, tone, researchSummary);
    }

    let outline;
    try {
      outline = JSON.parse(outlineText);
    } catch {
      throw new Error('Failed to parse outline JSON');
    }
    outline.title = outline.title || topic;

    // Step 2: Draft with Mistral Small (non-streaming, returns complete JSON)
    const researchContext = sources
      .map(s => `## ${s.title}\n${s.content || s.snippet}`)
      .join('\n\n')
      .slice(0, 4000);

    const draftText = await generateDraftWithClaude(outline, researchContext, tone, 150);

    let draft;
    try {
      draft = JSON.parse(draftText);
    } catch {
      throw new Error('Draft generation produced invalid JSON');
    }

    return NextResponse.json(draft);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
