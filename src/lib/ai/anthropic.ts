import Anthropic from '@anthropic-ai/sdk';
import type { Tone, Outline } from '@/lib/types';

let client: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export function buildDraftPrompt(
  outline: Outline,
  researchContext: string,
  tone: Tone,
  wordCount: number,
): { system: string; user: string } {
  const toneGuide: Record<Tone, string> = {
    professional: 'formal, authoritative, precise',
    conversational: 'friendly, accessible, first-person where natural',
    technical: 'detailed, jargon-appropriate, example-heavy',
    casual: 'relaxed, engaging, light use of humor',
  };

  const system = `You are an expert blog writer and SEO specialist. Write in a ${toneGuide[tone]} style.
Target length: approximately ${wordCount} words.

Output ONLY valid JSON with this exact structure:
{
  "title": "SEO-optimized title under 60 characters",
  "intro": "Compelling introduction paragraph",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Full section content in markdown format"
    }
  ],
  "conclusion": "Strong conclusion paragraph",
  "seo_meta": {
    "title": "Meta title under 60 chars",
    "description": "Meta description under 155 chars",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  }
}

Use markdown formatting within content fields. No preamble or explanation — only the JSON object.`;

  const outlineText = outline.sections
    .map(s => `${'#'.repeat(s.level)} ${s.heading}\n${s.key_points.map(p => `- ${p}`).join('\n')}`)
    .join('\n\n');

  const user = `Write a complete blog post based on this outline:

${outlineText}

Use this research for supporting facts, quotes, and context:
${researchContext.slice(0, 8000)}

Topic: ${outline.title}
Target audience: The tone should adapt to engage this audience effectively.`;

  return { system, user };
}

export async function streamDraft(
  outline: Outline,
  researchContext: string,
  tone: Tone,
  wordCount: number,
): Promise<ReadableStream<Uint8Array>> {
  const { system, user } = buildDraftPrompt(outline, researchContext, tone, wordCount);
  const anthropicClient = getAnthropicClient();

  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: user }],
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });
}
