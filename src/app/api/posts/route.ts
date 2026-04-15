import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('generated_posts')
    .select('id, topic, tone, audience, outline, content, seo_meta, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
