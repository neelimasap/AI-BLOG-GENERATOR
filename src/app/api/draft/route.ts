import { NextResponse } from 'next/server';
import { DraftRequestSchema } from '@/lib/validators/schema';
import { streamDraft } from '@/lib/ai/anthropic';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { outline, research_context, tone, word_count } = parsed.data;
    const stream = await streamDraft(outline as never, research_context, tone, word_count);
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Draft generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
