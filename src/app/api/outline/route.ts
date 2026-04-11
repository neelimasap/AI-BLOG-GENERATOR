import { NextResponse } from 'next/server';
import { OutlineRequestSchema } from '@/lib/validators/schema';
import { streamOutline } from '@/lib/ai/groq';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = OutlineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { topic, audience, tone, research_summary } = parsed.data;
    const stream = await streamOutline(topic, audience, tone, research_summary);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Outline generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
