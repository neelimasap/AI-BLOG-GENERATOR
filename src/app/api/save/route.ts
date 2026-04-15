import { NextResponse } from 'next/server';
import { SaveRequestSchema } from '@/lib/validators/schema';
import { generateImage } from '@/lib/ai/fal';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function buildImagePrompt(input: {
  topic: string;
  tone: string;
  audience: string;
  outline: string;
  seo_meta: { keywords: string[] };
}) {
  let title = input.topic;

  try {
    const parsed = JSON.parse(input.outline) as { title?: string };
    if (parsed.title) title = parsed.title;
  } catch {
    // Fall back to the topic when outline JSON is malformed.
  }

  const keywords = input.seo_meta.keywords.slice(0, 5);
  const keywordText = keywords.length ? ` Keywords: ${keywords.join(', ')}.` : '';

  return `Blog cover image for "${title}". Audience: ${input.audience}. Tone: ${input.tone}.${keywordText} Editorial hero image, clean composition, no text overlay, visually striking.`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { topic, tone, audience, outline, content, seo_meta, image_url, sources } = parsed.data;
    let imageUrl = image_url || null;

    if (!imageUrl) {
      try {
        const image = await generateImage(
          buildImagePrompt({ topic, tone, audience, outline, seo_meta }),
          'photorealistic',
        );
        imageUrl = image.url;
      } catch {
        // Keep saving resilient even if image generation fails.
      }
    }

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
        image_url: imageUrl,
        sources,
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
