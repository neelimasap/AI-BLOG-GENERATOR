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

export async function generateImage(
  prompt: string,
  style: ImageStyle,
): Promise<FalImageResult> {
  const fullPrompt = `${prompt}, ${stylePromptSuffix[style]}`;

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
}
