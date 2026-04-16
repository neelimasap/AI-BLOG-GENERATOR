import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from('generated_posts')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
