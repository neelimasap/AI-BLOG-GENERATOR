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

export async function generateDraftWithMistral(
  outline: Outline,
  researchContext: string,
  tone: Tone,
  wordCount: number,
): Promise<string> {
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
Target length: approximately ${wordCount} words per section.

Output ONLY valid JSON with this exact structure — no other text before or after:
{
  "title": "SEO-optimized title under 60 characters",
  "intro": "Compelling introduction paragraph (2-3 sentences)",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content (2-4 sentences per section)"
    }
  ],
  "conclusion": "Strong conclusion paragraph (2-3 sentences)",
  "suggestions": ["Next step 1", "Next step 2", "Next step 3"],
  "seo_meta": {
    "title": "Meta title under 60 chars",
    "description": "Meta description under 155 chars",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  }
}`;

  const user = `Write a concise blog post about: "${outline.title}"

Keep each section to 2-4 sentences. Total output must be under 2000 tokens.

Outline:
${outlineText}

Research snippets:
${researchContext.slice(0, 4000)}`;

  const mistral = getMistralClient();
  const response = await mistral.chat.complete({
    model: 'mistral-small-latest',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    maxTokens: 2500,
  });

  const text = response.choices?.[0]?.message?.content;
  const str = typeof text === 'string' ? text : '';
  return str.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}
