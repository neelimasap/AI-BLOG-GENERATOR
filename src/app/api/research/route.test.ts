import { searchExa } from '@/lib/research/exa';
import { searchSerp } from '@/lib/research/serp';

// Mock the external services
jest.mock('@/lib/research/exa');
jest.mock('@/lib/research/serp');

const mockSearchExa = searchExa as jest.MockedFunction<typeof searchExa>;
const mockSearchSerp = searchSerp as jest.MockedFunction<typeof searchSerp>;

describe('Research API logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should combine research results from multiple sources', async () => {
    const mockExaResults = [
      {
        id: '1',
        title: 'Test Article 1',
        url: 'https://example.com/1',
        snippet: 'Test snippet 1',
        source: 'exa' as const,
      },
    ];

    const mockSerpResults = [
      {
        id: '2',
        title: 'Test Article 2',
        url: 'https://example.com/2',
        snippet: 'Test snippet 2',
        source: 'serp' as const,
      },
    ];

    mockSearchExa.mockResolvedValue(mockExaResults);
    mockSearchSerp.mockResolvedValue(mockSerpResults);

    // Simulate the API logic
    const [exaRes, serpRes] = await Promise.allSettled([
      searchExa('test query', 8),
      searchSerp('test query', 8),
    ]);

    const sources = [
      ...(exaRes.status === 'fulfilled' ? exaRes.value : []),
      ...(serpRes.status === 'fulfilled' ? serpRes.value : [])
    ];

    expect(sources).toHaveLength(2);
    expect(sources[0].title).toBe('Test Article 1');
    expect(sources[1].title).toBe('Test Article 2');
    expect(mockSearchExa).toHaveBeenCalledWith('test query', 8);
    expect(mockSearchSerp).toHaveBeenCalledWith('test query', 8);
  });

  it('should handle service failures gracefully', async () => {
    mockSearchExa.mockRejectedValue(new Error('Exa failed'));
    mockSearchSerp.mockResolvedValue([]);

    const [exaRes, serpRes] = await Promise.allSettled([
      searchExa('test query', 8),
      searchSerp('test query', 8),
    ]);

    const sources = [
      ...(exaRes.status === 'fulfilled' ? exaRes.value : []),
      ...(serpRes.status === 'fulfilled' ? serpRes.value : [])
    ];

    expect(sources).toHaveLength(0);
  });
});