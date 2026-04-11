'use client';

import { useWorkflowStore } from './useWorkflowStore';
import type { ImageStyle } from '@/lib/types';

export function useImageGeneration() {
  const { projectId, addImage, setError } = useWorkflowStore();

  async function generateImage(prompt: string, style: ImageStyle) {
    if (!projectId) {
      setError('Project required before generating images');
      return;
    }

    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style, project_id: projectId }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      setError(error ?? 'Image generation failed');
      return;
    }

    const image = await res.json();
    addImage(image);
  }

  return { generateImage };
}
