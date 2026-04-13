import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Tone } from '@/lib/types';

let client: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required');
    }
    client = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return client;
}

export async function generateOutlineWithGemini(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): Promise<string> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert content strategist. Output ONLY valid JSON matching this schema exactly:
{
  "title": string,
  "meta_description": string,
  "sections": [{ "id": string, "heading": string, "level": 2, "key_points": string[], "estimated_words": number, "subsections": [] }],
  "total_estimated_words": number
}
No markdown, no explanation — only the JSON object.

Create a detailed blog outline strictly about: "${topic}"
Audience: ${audience}
Tone: ${tone}

Research (use only what is relevant to "${topic}"):
${researchSummary.slice(0, 4000)}

Requirements: 5-8 sections, 3-5 key points each, ~1000 words total. Every section must be about "${topic}".`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}
