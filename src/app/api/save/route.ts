import { NextResponse } from 'next/server';
import { SaveRequestSchema } from '@/lib/validators/schema';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { topic, tone, audience, outline, content, seo_meta, image_url, sources } = parsed.data;

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('generated_posts')
      .insert({
        topic,
        tone,
        audience,
        outline,
        content,
        seo_meta,
        image_url,
        sources
      })
      .select()
      .single();

    if (error) throw new Error(`Supabase error: ${error.message} | code: ${error.code} | details: ${error.details}`);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}