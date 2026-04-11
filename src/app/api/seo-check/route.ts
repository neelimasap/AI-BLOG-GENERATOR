import { NextResponse } from 'next/server';
import { SEOCheckRequestSchema } from '@/lib/validators/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SEOCheckRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { content, title, description, keywords } = parsed.data;

    // Basic SEO analysis
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Readability score (simplified - count sentences and complex words)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));

    // Keyword density
    const keywordDensity: Record<string, number> = {};
    const words = content.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      const count = words.filter(word => word.includes(keyword.toLowerCase())).length;
      keywordDensity[keyword] = (count / wordCount) * 100;
    });

    // Title analysis
    const titleLength = title.length;
    const titleScore = titleLength >= 30 && titleLength <= 60 ? 100 :
                      titleLength < 30 ? 60 : 40;

    // Description analysis
    const descLength = description.length;
    const descScore = descLength >= 120 && descLength <= 155 ? 100 :
                     descLength < 120 ? 70 : 50;

    // Overall SEO score
    const overallScore = Math.round(
      (readabilityScore * 0.3) +
      (titleScore * 0.25) +
      (descScore * 0.25) +
      (Math.min(100, Object.values(keywordDensity).reduce((a, b) => a + b, 0) * 10) * 0.2)
    );

    return NextResponse.json({
      overall_score: overallScore,
      readability: {
        score: Math.round(readabilityScore),
        word_count: wordCount,
        reading_time_minutes: readingTime,
        avg_words_per_sentence: Math.round(avgWordsPerSentence * 10) / 10,
      },
      title: {
        score: titleScore,
        length: titleLength,
        recommendation: titleLength < 30 ? 'Title too short (< 30 chars)' :
                       titleLength > 60 ? 'Title too long (> 60 chars)' : 'Good length',
      },
      description: {
        score: descScore,
        length: descLength,
        recommendation: descLength < 120 ? 'Description too short (< 120 chars)' :
                         descLength > 155 ? 'Description too long (> 155 chars)' : 'Good length',
      },
      keywords: {
        density: keywordDensity,
        recommendations: Object.entries(keywordDensity)
          .filter(([, density]) => density > 3)
          .map(([keyword]) => `${keyword}: density too high (>3%)`)
          .concat(
            Object.entries(keywordDensity)
              .filter(([, density]) => density < 0.5)
              .map(([keyword]) => `${keyword}: density too low (<0.5%)`)
          ),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SEO check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}