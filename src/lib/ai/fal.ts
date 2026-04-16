import * as fal from '@fal-ai/serverless-client';
import type { ImageStyle } from '@/lib/types';

// fal reads FAL_KEY from env automatically

const stylePromptSuffix: Record<ImageStyle, string> = {
  photorealistic: 'photorealistic, high resolution, professional photography',
  illustration: 'digital illustration, clean lines, vibrant colors',
  diagram: 'clean diagram, white background, professional infographic style',
  infographic: 'modern infographic, data visualization, clean typography',
};

export interface FalImageResult {
  fal_request_id: string;
  url: string;
  width: number;
  height: number;
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text: string, maxLineLength: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLineLength) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 4);
}

function extractFallbackTitle(prompt: string): string {
  const quotedTitleMatch = prompt.match(/"([^"]+)"/);
  if (quotedTitleMatch?.[1]) {
    return quotedTitleMatch[1].trim();
  }

  const beforeAudience = prompt.split(/Audience:/i)[0] ?? prompt;
  return beforeAudience
    .replace(/^Blog cover image for\s*/i, '')
    .replace(/^Header image for blog post:\s*/i, '')
    .replace(/\.$/, '')
    .trim();
}

function createFallbackImage(prompt: string): FalImageResult {
  const width = 1600;
  const height = 900;
  const palette = [
    ['#0f172a', '#1d4ed8', '#38bdf8'],
    ['#3f1d2e', '#b45309', '#f59e0b'],
    ['#172554', '#4338ca', '#22d3ee'],
    ['#1f2937', '#065f46', '#34d399'],
  ];
  const paletteIndex = hashString(prompt) % palette.length;
  const [bgStart, bgEnd, accent] = palette[paletteIndex];
  const title = extractFallbackTitle(prompt) || 'AI Blog Cover';
  const lines = wrapLines(title, 24);
  const titleLines = lines.length ? lines : ['AI Blog Cover'];

  const textElements = titleLines
    .map((line, index) => (
      `<text x="120" y="${260 + (index * 86)}" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700">${escapeXml(line)}</text>`
    ))
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgStart}" />
          <stop offset="100%" stop-color="${bgEnd}" />
        </linearGradient>
        <radialGradient id="glow" cx="82%" cy="18%" r="52%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <circle cx="1320" cy="160" r="320" fill="url(#glow)" />
      <circle cx="1240" cy="720" r="220" fill="${accent}" opacity="0.22" />
      <rect x="90" y="110" width="1420" height="680" rx="44" fill="#0f172a" fill-opacity="0.16" stroke="#e2e8f0" stroke-opacity="0.18" />
      <text x="120" y="180" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="5">AI BLOG GENERATOR</text>
      ${textElements}
      <text x="120" y="760" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="24">Generated cover</text>
    </svg>
  `.replace(/\s+/g, ' ').trim();

  return {
    fal_request_id: `fallback-${hashString(prompt)}`,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    width,
    height,
  };
}

export async function generateImage(
  prompt: string,
  style: ImageStyle,
): Promise<FalImageResult> {
  const fullPrompt = `${prompt}, ${stylePromptSuffix[style]}`;

  try {
    const result = await fal.run('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
      },
    }) as { images: Array<{ url: string; width: number; height: number }>; request_id: string };

    const image = result.images[0];
    return {
      fal_request_id: result.request_id,
      url: image.url,
      width: image.width,
      height: image.height,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed';
    const fallbackableMessage = /forbidden|unauthorized|exhausted balance|authentication is required/i.test(message);

    if (!fallbackableMessage) {
      throw error;
    }

    return createFallbackImage(prompt);
  }
}
