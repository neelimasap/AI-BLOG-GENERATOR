import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { generateImage } from '@/lib/ai/fal';

type Params = { params: { id: string } };

function buildImagePrompt(post: {
  topic: string;
  audience: string;
  tone: string;
  outline: string | null;
  seo_meta: unknown;
}) {
  let title = post.topic;
  let keywords: string[] = [];

  if (post.outline) {
    try {
      const parsed = JSON.parse(post.outline) as { title?: string };
      if (parsed.title) title = parsed.title;
    } catch {
      // fall back to the topic when outline JSON is malformed
    }
  }

  if (
    post.seo_meta &&
    typeof post.seo_meta === 'object' &&
    'keywords' in post.seo_meta &&
    Array.isArray((post.seo_meta as { keywords?: unknown }).keywords)
  ) {
    keywords = ((post.seo_meta as { keywords?: unknown[] }).keywords ?? [])
      .filter((keyword): keyword is string => typeof keyword === 'string')
      .slice(0, 5);
  }

  const keywordText = keywords.length ? ` Keywords: ${keywords.join(', ')}.` : '';

  return `Blog cover image for "${title}". Audience: ${post.audience}. Tone: ${post.tone}.${keywordText} Editorial hero image, clean composition, no text overlay, visually striking.`;
}

export async function POST(_req: Request, { params }: Params) {
  const supabase = getSupabaseServer();

  const { data: post, error: postError } = await supabase
    .from('generated_posts')
    .select('id, topic, audience, tone, outline, seo_meta')
    .eq('id', params.id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  try {
    const image = await generateImage(buildImagePrompt(post), 'photorealistic');

    const { data, error } = await supabase
      .from('generated_posts')
      .update({ image_url: image.url })
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
