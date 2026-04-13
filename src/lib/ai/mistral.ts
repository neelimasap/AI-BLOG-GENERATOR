import { Mistral } from '@mistralai/mistralai';
import type { Tone, Outline } from '@/lib/types';

let client: Mistral | null = null;

function getMistralClient(): Mistral {
  if (!client) {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is required');
    }
    client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  }
  return client;
}

export async function streamDraftWithMistral(
  outline: Outline,
  researchContext: string,
  tone: Tone,
  wordCount: number,
): Promise<ReadableStream<Uint8Array>> {
  const toneGuide: Record<Tone, string> = {
    professional: 'formal, authoritative, precise',
    conversational: 'friendly, accessible, first-person where natural',
    technical: 'detailed, jargon-appropriate, example-heavy',
    casual: 'relaxed, engaging, light use of humor',
  };

  const outlineText = outline.sections
    .map(s => `${'#'.repeat(s.level)} ${s.heading}\n${s.key_points.map(p => `- ${p}`).join('\n')}`)
    .join('\n\n');

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

  const user = `Write a complete blog post strictly about this topic: "${outline.title}"

IMPORTANT: Only use research that is directly relevant to "${outline.title}". Ignore anything unrelated.

Outline to follow:
${outlineText}

Research (use only what is relevant):
${researchContext.slice(0, 16000)}

Stay on topic throughout. Every section must relate directly to "${outline.title}".`;

  const mistral = getMistralClient();
  const stream = await mistral.chat.stream({
    model: 'mistral-large-latest',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    maxTokens: 4096,
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.data.choices[0]?.delta?.content;
        const text = typeof content === 'string' ? content : '';
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}
