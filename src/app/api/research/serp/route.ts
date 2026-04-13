import { NextResponse } from 'next/server';
import { ResearchRequestSchema } from '@/lib/validators/schema';
import { searchSerp } from '@/lib/research/serp';


export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const results = await searchSerp(parsed.data.query, parsed.data.num_results);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SerpAPI search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
