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
  const response = await client.searchAndContents(query, {
    numResults,
    useAutoprompt: true,
    text: { maxCharacters: 3000 },
    highlights: { numSentences: 3, highlightsPerUrl: 2 },
  });

  return response.results.map(r => ({
    id: randomUUID(),
    source: 'exa' as const,
    title: r.title ?? 'Untitled',
    url: r.url,
    snippet: (r.highlights?.join(' ') || r.text?.slice(0, 400)) ?? '',
    published_date: r.publishedDate ?? null,
    full_content: null,
    is_selected: false,
    scraped_at: null,
  }));
}
