import {
  generateDraftWithFallback,
  generateOutlineWithFallback,
} from '@/lib/ai/generateWithFallback';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';
import { generateDraftWithClaude, streamOutlineWithClaude } from '@/lib/ai/anthropic';
import { generateOutlineWithGemini } from '@/lib/ai/gemini';
import { streamOutline } from '@/lib/ai/groq';
import { generateDraftWithMistral } from '@/lib/ai/mistral';
import {
  generateDraftWithOpenRouter,
  generateOutlineWithOpenRouter,
} from '@/lib/ai/openrouter';

jest.mock('@/lib/ai/openrouter', () => ({
  generateDraftWithOpenRouter: jest.fn(),
  generateOutlineWithOpenRouter: jest.fn(),
}));
jest.mock('@/lib/ai/gemini', () => ({
  generateOutlineWithGemini: jest.fn(),
}));
jest.mock('@/lib/ai/anthropic', () => ({
  generateDraftWithClaude: jest.fn(),
  streamOutlineWithClaude: jest.fn(),
}));
jest.mock('@/lib/ai/groq', () => ({
  streamOutline: jest.fn(),
}));
jest.mock('@/lib/ai/mistral', () => ({
  generateDraftWithMistral: jest.fn(),
}));

const mockGenerateOutlineWithOpenRouter =
  generateOutlineWithOpenRouter as jest.MockedFunction<typeof generateOutlineWithOpenRouter>;
const mockGenerateOutlineWithGemini =
  generateOutlineWithGemini as jest.MockedFunction<typeof generateOutlineWithGemini>;
const mockStreamOutlineWithClaude =
  streamOutlineWithClaude as jest.MockedFunction<typeof streamOutlineWithClaude>;
const mockStreamOutline =
  streamOutline as jest.MockedFunction<typeof streamOutline>;
const mockGenerateDraftWithOpenRouter =
  generateDraftWithOpenRouter as jest.MockedFunction<typeof generateDraftWithOpenRouter>;
const mockGenerateDraftWithClaude =
  generateDraftWithClaude as jest.MockedFunction<typeof generateDraftWithClaude>;
const mockGenerateDraftWithMistral =
  generateDraftWithMistral as jest.MockedFunction<typeof generateDraftWithMistral>;

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

describe('generateWithFallback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    Object.assign(global, { TextEncoder, TextDecoder, ReadableStream });
    process.env = {
      ...originalEnv,
      OPENROUTER_API_KEY: 'openrouter',
      GOOGLE_GENERATIVE_AI_API_KEY: 'gemini',
      ANTHROPIC_API_KEY: 'anthropic',
      GROQ_API_KEY: 'groq',
      MISTRAL_API_KEY: 'mistral',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back to Gemini for outline generation when OpenRouter fails', async () => {
    mockGenerateOutlineWithOpenRouter.mockRejectedValue(new Error('OpenRouter down'));
    mockGenerateOutlineWithGemini.mockResolvedValue(
      '{"title":"Fallback Outline","meta_description":"desc","sections":[],"total_estimated_words":1000}',
    );

    const result = await generateOutlineWithFallback(
      'Topic',
      'Audience',
      'technical',
      'Research summary',
    );

    expect(result.provider).toBe('gemini');
    expect(result.outline.title).toBe('Fallback Outline');
    expect(mockGenerateOutlineWithGemini).toHaveBeenCalled();
  });

  it('falls back when OpenRouter outline JSON is invalid', async () => {
    mockGenerateOutlineWithOpenRouter.mockResolvedValue('not json');
    mockGenerateOutlineWithGemini.mockResolvedValue(
      '{"title":"Gemini Outline","meta_description":"desc","sections":[],"total_estimated_words":1000}',
    );

    const result = await generateOutlineWithFallback(
      'Topic',
      'Audience',
      'technical',
      'Research summary',
    );

    expect(result.provider).toBe('gemini');
    expect(result.outline.title).toBe('Gemini Outline');
  });

  it('reads Groq stream output as a later outline fallback', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = '';
    process.env.ANTHROPIC_API_KEY = '';

    mockGenerateOutlineWithOpenRouter.mockRejectedValue(new Error('OpenRouter down'));
    mockStreamOutline.mockResolvedValue(
      createMockStream([
        '{"title":"Groq Outline","meta_description":"desc","sections":[],"total_estimated_words":900}',
      ]),
    );

    const result = await generateOutlineWithFallback(
      'Topic',
      'Audience',
      'technical',
      'Research summary',
    );

    expect(result.provider).toBe('groq');
    expect(result.outline.title).toBe('Groq Outline');
  });

  it('falls back to Anthropic for draft generation when OpenRouter fails', async () => {
    mockGenerateDraftWithOpenRouter.mockRejectedValue(new Error('OpenRouter down'));
    mockGenerateDraftWithClaude.mockResolvedValue(
      '{"title":"Draft","intro":"Intro","sections":[],"conclusion":"End","seo_meta":{"title":"SEO","description":"Desc","keywords":["a"]}}',
    );

    const result = await generateDraftWithFallback(
      {
        title: 'Outline',
        meta_description: 'desc',
        sections: [],
        total_estimated_words: 1000,
      },
      'Research',
      'technical',
      150,
    );

    expect(result.provider).toBe('anthropic');
    expect(result.draft.title).toBe('Draft');
  });

  it('falls back to Mistral when OpenRouter and Anthropic draft attempts fail', async () => {
    mockGenerateDraftWithOpenRouter.mockResolvedValue('invalid');
    mockGenerateDraftWithClaude.mockRejectedValue(new Error('Anthropic timeout'));
    mockGenerateDraftWithMistral.mockResolvedValue(
      '{"title":"Mistral Draft","intro":"Intro","sections":[],"conclusion":"End","seo_meta":{"title":"SEO","description":"Desc","keywords":["a"]}}',
    );

    const result = await generateDraftWithFallback(
      {
        title: 'Outline',
        meta_description: 'desc',
        sections: [],
        total_estimated_words: 1000,
      },
      'Research',
      'technical',
      150,
    );

    expect(result.provider).toBe('mistral');
    expect(result.draft.title).toBe('Mistral Draft');
  });

  it('throws a clear error when no fallback providers are configured', async () => {
    process.env.OPENROUTER_API_KEY = '';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = '';
    process.env.ANTHROPIC_API_KEY = '';
    process.env.GROQ_API_KEY = '';

    await expect(
      generateOutlineWithFallback('Topic', 'Audience', 'technical', 'Research summary'),
    ).rejects.toThrow('No outline providers are configured');
  });
});
