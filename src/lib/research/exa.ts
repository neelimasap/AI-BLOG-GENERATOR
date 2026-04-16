import Exa from 'exa-js';
import type { ResearchResult } from '@/lib/types';
import { randomUUID } from 'crypto';

let exa: Exa | null = null;
type ExaSearchResult = {
  publishedDate?: string | null;
  text?: string | null;
  summary?: string | null;
};

function getExaClient(): Exa {
  if (!exa) {
    if (!process.env.EXA_API_KEY) {
      throw new Error('EXA_API_KEY environment variable is required');
    }
    exa = new Exa(process.env.EXA_API_KEY);
  }
  return exa;
}

export async function searchExa(
  query: string,
  numResults = 10,
): Promise<ResearchResult[]> {
  const client = getExaClient();

  // Use keyword search to keep Exa close to the user's topic while still
  // returning page text we can surface as a meaningful snippet.
  const response = await client.search(query, {
    numResults,
    useAutoprompt: false,
    type: 'keyword',
    contents: {
      text: {
        maxCharacters: 2400,
      },
      summary: true,
    },
  });

  return response.results.map(r => ({
    id: randomUUID(),
    source: 'exa' as const,
    title: r.title ?? 'Untitled',
    url: r.url,
    snippet:
      (r as ExaSearchResult).summary?.trim() ||
      (r as ExaSearchResult).text?.replace(/\s+/g, ' ').trim().slice(0, 280) ||
      r.url,
    published_date: (r as ExaSearchResult).publishedDate ?? null,
    full_content: null,
    is_selected: false,
    scraped_at: null,
  }));
}
