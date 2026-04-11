import FirecrawlApp from '@mendable/firecrawl-js';

let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawlClient(): FirecrawlApp {
  if (!firecrawlClient) {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }
    firecrawlClient = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  }
  return firecrawlClient;
}

export async function scrapeUrl(url: string): Promise<string> {
  const firecrawl = getFirecrawlClient();
  const result = await firecrawl.v1.scrapeUrl(url, { formats: ['markdown'] });

  if (!result.success) {
    throw new Error(`Firecrawl failed for ${url}`);
  }

  return (result as { markdown?: string }).markdown ?? '';
}
