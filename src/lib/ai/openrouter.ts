import OpenAI from 'openai';
import type { Tone, Outline } from '@/lib/types';

let client: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://ai-blog-generator.vercel.app',
        'X-Title': 'AI Blog Generator',
      },
    });
  }
  return client;
}

export async function generateOutlineWithOpenRouter(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): Promise<string> {
  const openrouter = getOpenRouterClient();

  const response = await openrouter.chat.completions.create({
    model: 'google/gemini-2.0-flash-001',
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `You are an expert content strategist. Output ONLY valid JSON matching this schema exactly:
{
  "title": string,
  "meta_description": string,
  "sections": [{ "id": string, "heading": string, "level": 2, "key_points": string[], "estimated_words": number, "subsections": [] }],
  "total_estimated_words": number
}
No markdown, no explanation — only the JSON object.`,
      },
      {
        role: 'user',
        content: `Create a detailed blog outline strictly about: "${topic}"
Audience: ${audience}
Tone: ${tone}

Research (use only what is relevant to "${topic}"):
${researchSummary.slice(0, 4000)}

Requirements: 5-8 sections, 3-5 key points each, ~1500 words total. Every section must be about "${topic}".`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function generateDraftWithOpenRouter(
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

IMPORTANT: The research below may contain off-topic articles. Only use information that is directly relevant to "${outline.title}". Ignore anything unrelated.

Outline to follow:
${outlineText}

Research (use only what is relevant to the topic):
${researchContext.slice(0, 4000)}

Stay on topic throughout. Every section must relate directly to "${outline.title}".`;

  const openrouter = getOpenRouterClient();

  const response = await openrouter.chat.completions.create({
    model: 'meta-llama/llama-3.3-70b-instruct',
    max_tokens: 3000,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const text = response.choices[0]?.message?.content ?? '';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}
