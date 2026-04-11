import { NextResponse } from 'next/server';
import { GenerateRequestSchema } from '@/lib/validators/schema';
import { streamOutline } from '@/lib/ai/groq';
import { streamDraft } from '@/lib/ai/anthropic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { topic, audience, tone, research_sources } = parsed.data;

    // Step 1: Generate outline with Groq
    const researchSummary = research_sources
      .map(s => `${s.title}\n${s.content || s.snippet}`)
      .join('\n\n---\n\n');

    const outlineStream = await streamOutline(topic, audience, tone, researchSummary);

    // Read the outline stream to get the complete outline
    const outlineReader = outlineStream.getReader();
    const outlineDecoder = new TextDecoder();
    let outlineText = '';

    while (true) {
      const { done, value } = await outlineReader.read();
      if (done) break;
      outlineText += outlineDecoder.decode(value, { stream: true });
    }

    let outline;
    try {
      const cleaned = outlineText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      outline = JSON.parse(cleaned);
    } catch (e) {
      throw new Error('Failed to parse outline JSON');
    }

    // Step 2: Generate full post with Claude using the outline and research
    const researchContext = research_sources
      .map(s => `## ${s.title}\n${s.content || s.snippet}`)
      .join('\n\n')
      .slice(0, 16000);

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
