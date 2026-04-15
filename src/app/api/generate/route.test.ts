import { streamOutline } from '@/lib/ai/groq';
import { streamDraft } from '@/lib/ai/anthropic';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream } from 'stream/web';

// Mock the AI services
jest.mock('@/lib/ai/groq');
jest.mock('@/lib/ai/anthropic');

const mockStreamOutline = streamOutline as jest.MockedFunction<typeof streamOutline>;
const mockStreamDraft = streamDraft as jest.MockedFunction<typeof streamDraft>;

function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

describe('Generate API logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(global, { TextEncoder, TextDecoder, ReadableStream });
  });

  it('should call streamOutline with correct parameters', async () => {
    const mockOutlineStream = createMockStream([
      '{"title":"Test Title","sections":[],"meta_description":"Test desc","total_estimated_words":100}',
    ]);

    const mockDraftStream = createMockStream([
      '{"title":"Test Title","intro":"Test intro","sections":[],"conclusion":"Test conclusion","seo_meta":{"title":"Test","description":"Test","keywords":["test"]}}',
    ]);

    mockStreamOutline.mockResolvedValue(mockOutlineStream);
    mockStreamDraft.mockResolvedValue(mockDraftStream);

    // Simulate the API logic
    const topic = 'Test Topic';
    const audience = 'developers';
    const tone = 'technical';
    const researchSources = [
      { title: 'Source 1', url: 'https://example.com', snippet: 'Test', content: 'Full content' },
    ];

    // Step 1: Generate outline
    const researchSummary = researchSources
      .map(s => `${s.title}\n${s.content || s.snippet}`)
      .join('\n\n---\n\n');

    const outlineStreamResult = await streamOutline(topic, audience, tone, researchSummary);

    // Read the outline stream
    const outlineReader = outlineStreamResult.getReader();
    const decoder = new TextDecoder();
    let outlineText = '';
    while (true) {
      const { done, value } = await outlineReader.read();
      if (done) break;
      outlineText += decoder.decode(value, { stream: true });
    }
    outlineText += decoder.decode();

    const outline = JSON.parse(outlineText);

    // Step 2: Generate draft
    const researchContext = researchSources
      .map(s => `## ${s.title}\n${s.content || s.snippet}`)
      .join('\n\n')
      .slice(0, 16000);

    const draftStream = await streamDraft(outline, researchContext, tone, 1500);

    expect(outline.title).toBe('Test Title');
    expect(mockStreamOutline).toHaveBeenCalledWith(topic, audience, tone, expect.any(String));
    expect(mockStreamDraft).toHaveBeenCalled();
    expect(draftStream).toBeDefined();
  });

  it('should handle outline parsing errors', async () => {
    const mockOutlineStream = createMockStream(['invalid json']);

    mockStreamOutline.mockResolvedValue(mockOutlineStream);

    const researchSummary = 'test research';
    const outlineStreamResult = await streamOutline('topic', 'audience', 'tone', researchSummary);
    const outlineReader = outlineStreamResult.getReader();
    const decoder = new TextDecoder();
    let outlineText = '';

    while (true) {
      const { done, value } = await outlineReader.read();
      if (done) break;
      outlineText += decoder.decode(value, { stream: true });
    }
    outlineText += decoder.decode();

    expect(() => JSON.parse(outlineText)).toThrow();
  });
});
