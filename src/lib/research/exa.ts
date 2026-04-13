import Exa from 'exa-js';
import type { ResearchResult } from '@/lib/types';
import { randomUUID } from 'crypto';

let exa: Exa | null = null;

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

  // useAutoprompt:false + keyword search to prevent Exa rewriting the query
  const response = await client.search(query, {
    numResults,
    useAutoprompt: false,
    type: 'keyword',
  });

  return response.results.map(r => ({
    id: randomUUID(),
    source: 'exa' as const,
    title: r.title ?? 'Untitled',
    url: r.url,
    snippet: r.url, // no snippet from search-only, scraping will enrich
    published_date: (r as any).publishedDate ?? null,
    full_content: null,
    is_selected: false,
    scraped_at: null,
  }));
}
