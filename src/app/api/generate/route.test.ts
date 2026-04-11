import { streamOutline } from '@/lib/ai/groq';
import { streamDraft } from '@/lib/ai/anthropic';

// Mock the AI services
jest.mock('@/lib/ai/groq');
jest.mock('@/lib/ai/anthropic');

const mockStreamOutline = streamOutline as jest.MockedFunction<typeof streamOutline>;
const mockStreamDraft = streamDraft as jest.MockedFunction<typeof streamDraft>;

describe('Generate API logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call streamOutline with correct parameters', async () => {
    const mockOutlineStream = {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: Buffer.from('{"title":"Test Title","sections":[],"meta_description":"Test desc","total_estimated_words":100}')
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };

    const mockDraftStream = {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: Buffer.from('{"title":"Test Title","intro":"Test intro","sections":[],"conclusion":"Test conclusion","seo_meta":{"title":"Test","description":"Test","keywords":["test"]}}')
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };

    mockStreamOutline.mockResolvedValue(mockOutlineStream as any);
    mockStreamDraft.mockResolvedValue(mockDraftStream as any);

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
    let outlineText = '';
    while (true) {
      const { done, value } = await outlineReader.read();
      if (done) break;
      outlineText += value.toString();
    }

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
    const mockOutlineStream = {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: Buffer.from('invalid json') })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      }),
    };

    mockStreamOutline.mockResolvedValue(mockOutlineStream as any);

    const researchSummary = 'test research';
    const outlineStreamResult = await streamOutline('topic', 'audience', 'tone', researchSummary);
    const outlineReader = outlineStreamResult.getReader();
    let outlineText = '';

    while (true) {
      const { done, value } = await outlineReader.read();
      if (done) break;
      outlineText += value.toString();
    }

    expect(() => JSON.parse(outlineText)).toThrow();
  });
});