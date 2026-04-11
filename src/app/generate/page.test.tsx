// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

import { render, screen } from '@testing-library/react';
import GeneratePage from '@/app/generate/page';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GeneratePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify({
          topic: 'Test Topic',
          audience: 'developers',
          tone: 'technical',
        })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render the generate page', () => {
    render(<GeneratePage />);

    expect(screen.getByText(/generating your blog post/i)).toBeInTheDocument();
  });
});