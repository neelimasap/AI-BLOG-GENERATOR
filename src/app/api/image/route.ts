import { NextResponse } from 'next/server';
import { ImageRequestSchema } from '@/lib/validators/schema';
import { generateImage } from '@/lib/ai/fal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ImageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { prompt, style = 'photorealistic' } = parsed.data;
    const result = await generateImage(prompt, style);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
