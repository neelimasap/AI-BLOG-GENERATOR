import { NextResponse } from 'next/server';
import { UpdateDraftSchema } from '@/lib/validators/schema';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: { id: string; draftId: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', params.draftId)
    .eq('project_id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json().catch(() => null);
  const parsed = UpdateDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('drafts')
    .update(parsed.data)
    .eq('id', params.draftId)
    .eq('project_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', params.draftId)
    .eq('project_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
