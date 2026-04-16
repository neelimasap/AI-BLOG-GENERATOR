import { NextResponse } from 'next/server';
import { ResearchRequestSchema } from '@/lib/validators/schema';
import { searchExa } from '@/lib/research/exa';
import { searchSerp } from '@/lib/research/serp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { query, num_results = 12 } = parsed.data;

    // Run both searches in parallel
    const [exaResults, serpResults] = await Promise.allSettled([
      searchExa(query, num_results),
      searchSerp(query, num_results)
    ]);

    const combinedSources = [
      ...(exaResults.status === 'fulfilled' ? exaResults.value : []),
      ...(serpResults.status === 'fulfilled' ? serpResults.value : [])
    ];

    const sources = combinedSources.filter((source, index, allSources) => {
      const normalizedUrl = source.url.trim().toLowerCase();
      return index === allSources.findIndex((candidate) => candidate.url.trim().toLowerCase() === normalizedUrl);
    });

    return NextResponse.json({ sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Research failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
