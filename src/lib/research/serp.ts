import type { ResearchResult } from '@/lib/types';
import { randomUUID } from 'crypto';

interface SerpOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerpApiResponse {
  organic_results?: SerpOrganicResult[];
  error?: string;
}

export async function searchSerp(
  query: string,
  numResults = 10,
): Promise<ResearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    api_key: process.env.SERP_API_KEY!,
    num: String(numResults),
    engine: 'google',
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`);

  const data: SerpApiResponse = await res.json();
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  return (data.organic_results ?? []).slice(0, numResults).map(r => ({
    id: randomUUID(),
    source: 'serp' as const,
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    published_date: null,
    full_content: null,
    is_selected: false,
    scraped_at: null,
  }));
}
