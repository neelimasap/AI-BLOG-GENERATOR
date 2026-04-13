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
  "suggestions": ["Actionable next step 1", "Actionable next step 2", "Actionable next step 3"],
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

  const user = `Write a complete blog post strictly about this topic: "${outline.title}"

IMPORTANT: The research below may contain off-topic articles. Only use information that is directly relevant to "${outline.title}". Ignore anything unrelated. Do not let irrelevant research redirect the article topic.

Outline to follow:
${outlineText}

Research (use only what is relevant to the topic):
${researchContext.slice(0, 24000)}

Stay on topic throughout. Every section must relate directly to "${outline.title}".`;

  return { system, user };
}

export async function streamOutlineWithClaude(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): Promise<string> {
  const anthropicClient = getAnthropicClient();
  const response = await anthropicClient.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `You are an expert content strategist. Output ONLY valid JSON matching this schema exactly:
{
  "title": string,
  "meta_description": string,
  "sections": [{ "id": string, "heading": string, "level": 2, "key_points": string[], "estimated_words": number, "subsections": [] }],
  "total_estimated_words": number
}
No markdown, no explanation — only the JSON object.`,
    messages: [{
      role: 'user',
      content: `Create a detailed blog outline strictly about: "${topic}"
Audience: ${audience}
Tone: ${tone}

Research (use only what is relevant to "${topic}"):
${researchSummary.slice(0, 4000)}

Requirements: 5-8 sections, 3-5 key points each, ~1500 words total. Every section must be about "${topic}".`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
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
