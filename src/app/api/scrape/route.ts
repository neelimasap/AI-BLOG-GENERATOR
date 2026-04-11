import { NextResponse } from 'next/server';
import { ScrapeRequestSchema } from '@/lib/validators/schema';
import { scrapeUrl } from '@/lib/research/firecrawl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ScrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const content = await scrapeUrl(parsed.data.url);
    return NextResponse.json({ content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scrape failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
