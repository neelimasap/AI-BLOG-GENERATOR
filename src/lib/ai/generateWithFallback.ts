import type { Outline, Tone } from '@/lib/types';
import { generateDraftWithClaude, streamOutlineWithClaude } from '@/lib/ai/anthropic';
import { generateOutlineWithGemini } from '@/lib/ai/gemini';
import { streamOutline } from '@/lib/ai/groq';
import { generateDraftWithMistral } from '@/lib/ai/mistral';
import {
  generateDraftWithOpenRouter,
  generateOutlineWithOpenRouter,
} from '@/lib/ai/openrouter';

type DraftResult = {
  title: string;
  intro: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
  suggestions?: string[];
  seo_meta: {
    title: string;
    description: string;
    keywords: string[];
  };
};

type Attempt<T> = {
  name: string;
  enabled: boolean;
  run: () => Promise<T>;
};

function cleanJsonText(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

async function readStreamAsText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function parseOutlineJson(text: string): Outline {
  const parsed = JSON.parse(cleanJsonText(text));

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.title !== 'string' ||
    !Array.isArray(parsed.sections)
  ) {
    throw new Error('Outline generation produced invalid JSON');
  }

  return {
    title: parsed.title,
    meta_description: typeof parsed.meta_description === 'string' ? parsed.meta_description : '',
    sections: parsed.sections,
    total_estimated_words:
      typeof parsed.total_estimated_words === 'number' ? parsed.total_estimated_words : 0,
  };
}

function parseDraftJson(text: string): DraftResult {
  const parsed = JSON.parse(cleanJsonText(text));

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.title !== 'string' ||
    !Array.isArray(parsed.sections) ||
    !parsed.seo_meta ||
    typeof parsed.seo_meta.title !== 'string' ||
    typeof parsed.seo_meta.description !== 'string' ||
    !Array.isArray(parsed.seo_meta.keywords)
  ) {
    throw new Error('Draft generation produced invalid JSON');
  }

  return parsed as DraftResult;
}

async function runWithFallback<T>(label: string, attempts: Attempt<T>[]): Promise<{ provider: string; result: T }> {
  const enabledAttempts = attempts.filter((attempt) => attempt.enabled);

  if (enabledAttempts.length === 0) {
    throw new Error(`No ${label} providers are configured`);
  }

  const failures: string[] = [];

  for (const attempt of enabledAttempts) {
    try {
      const result = await attempt.run();
      return { provider: attempt.name, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      failures.push(`${attempt.name}: ${message}`);
      console.warn(`${label} provider failed`, { provider: attempt.name, message });
    }
  }

  throw new Error(`All ${label} providers failed. ${failures.join(' | ')}`);
}

export async function generateOutlineWithFallback(
  topic: string,
  audience: string,
  tone: Tone,
  researchSummary: string,
): Promise<{ provider: string; outline: Outline }> {
  const { provider, result } = await runWithFallback('outline', [
    {
      name: 'openrouter',
      enabled: Boolean(process.env.OPENROUTER_API_KEY),
      run: async () =>
        parseOutlineJson(
          await generateOutlineWithOpenRouter(topic, audience, tone, researchSummary),
        ),
    },
    {
      name: 'gemini',
      enabled: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      run: async () =>
        parseOutlineJson(
          await generateOutlineWithGemini(topic, audience, tone, researchSummary),
        ),
    },
    {
      name: 'anthropic',
      enabled: Boolean(process.env.ANTHROPIC_API_KEY),
      run: async () =>
        parseOutlineJson(
          await streamOutlineWithClaude(topic, audience, tone, researchSummary),
        ),
    },
    {
      name: 'groq',
      enabled: Boolean(process.env.GROQ_API_KEY),
      run: async () =>
        parseOutlineJson(
          await readStreamAsText(await streamOutline(topic, audience, tone, researchSummary)),
        ),
    },
  ]);

  return { provider, outline: result };
}

export async function generateDraftWithFallback(
  outline: Outline,
  researchContext: string,
  tone: Tone,
  wordCount: number,
): Promise<{ provider: string; draft: DraftResult }> {
  const { provider, result } = await runWithFallback('draft', [
    {
      name: 'openrouter',
      enabled: Boolean(process.env.OPENROUTER_API_KEY),
      run: async () =>
        parseDraftJson(
          await generateDraftWithOpenRouter(outline, researchContext, tone, wordCount),
        ),
    },
    {
      name: 'anthropic',
      enabled: Boolean(process.env.ANTHROPIC_API_KEY),
      run: async () =>
        parseDraftJson(
          await generateDraftWithClaude(outline, researchContext, tone, wordCount),
        ),
    },
    {
      name: 'mistral',
      enabled: Boolean(process.env.MISTRAL_API_KEY),
      run: async () =>
        parseDraftJson(
          await generateDraftWithMistral(outline, researchContext, tone, wordCount),
        ),
    },
  ]);

  return { provider, draft: result };
}
