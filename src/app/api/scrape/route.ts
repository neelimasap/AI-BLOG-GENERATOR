import { NextResponse } from 'next/server';
import { ScrapeRequestSchema } from '@/lib/validators/schema';
import { scrapeUrl } from '@/lib/research/firecrawl';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ScrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Scrape timeout')), 25000)
    );
    const content = await Promise.race([scrapeUrl(parsed.data.url), timeout]);
    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scrape failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
