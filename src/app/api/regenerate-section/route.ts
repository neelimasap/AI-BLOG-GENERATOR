import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.heading || !body?.topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { heading, current_content, topic, tone } = body;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an expert blog writer. Rewrite the given section to be more engaging, clear, and well-structured. Keep the same heading topic but improve the content quality. Use markdown formatting. Output only the rewritten section content, no heading, no preamble.`,
      messages: [{
        role: 'user',
        content: `Blog topic: ${topic}
Tone: ${tone || 'professional'}
Section heading: ${heading}

Current content:
${current_content}

Rewrite this section to be better.`,
      }],
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Regeneration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
