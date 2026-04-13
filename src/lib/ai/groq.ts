import Groq from 'groq-sdk';
import type { Tone } from '@/lib/types';

let client: Groq | null = null;

function getGroqClient(): Groq {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export function buildOutlinePrompt(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): { system: string; user: string } {
  const system = `You are an expert content strategist. Output ONLY valid JSON matching this schema exactly:
{
  "title": string,
  "meta_description": string (150-160 chars),
  "sections": [
    {
      "id": string (uuid v4),
      "heading": string,
      "level": 1|2|3,
      "key_points": string[],
      "estimated_words": number,
      "subsections": []
    }
  ],
  "total_estimated_words": number
}
No markdown, no explanation — only the JSON object.`;

  const user = `Create a detailed blog outline strictly about this topic: "${topic}"

Audience: ${audience}
Tone: ${tone}

Research context (use only what is relevant to "${topic}" — ignore off-topic content):
${researchSummary.slice(0, 4000)}

Requirements:
- The title and every section must be directly about "${topic}"
- 5-8 main sections (H2)
- 3-5 key points per section
- Include an intro and conclusion section
- Distribute word count to hit approximately 1500 words total`;

  return { system, user };
}

export async function streamOutline(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): Promise<ReadableStream<Uint8Array>> {
  const { system, user } = buildOutlinePrompt(topic, audience, tone, researchSummary);
  const groqClient = getGroqClient();

  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 4096,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const token = chunk.choices[0]?.delta?.content ?? '';
        if (token) controller.enqueue(encoder.encode(token));
      }
      controller.close();
    },
  });
}
