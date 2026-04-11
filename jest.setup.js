import '@testing-library/jest-dom';

// Mock external API clients
jest.mock('@/lib/ai/groq', () => ({
  streamOutline: jest.fn(),
}));

jest.mock('@/lib/ai/anthropic', () => ({
  streamDraft: jest.fn(),
}));

jest.mock('@/lib/research/exa', () => ({
  searchExa: jest.fn(),
}));

jest.mock('@/lib/research/serp', () => ({
  searchSerp: jest.fn(),
}));

jest.mock('@/lib/ai/fal', () => ({
  generateImage: jest.fn(),
}));

jest.mock('@/lib/research/firecrawl', () => ({
  scrapeUrl: jest.fn(),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
  },
}));