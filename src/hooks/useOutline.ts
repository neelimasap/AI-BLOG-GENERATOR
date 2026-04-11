'use client';

import { useWorkflowStore } from './useWorkflowStore';
import type { Outline } from '@/lib/types';

export function useOutline() {
  const { topic, audience, tone, researchResults, appendOutlineText, setOutline, setStreaming, setError } =
    useWorkflowStore();

  async function generateOutline() {
    setStreaming(true);
    setError(null);

    const selectedSources = researchResults.filter((r) => r.is_selected);
    const researchSummary = selectedSources
      .map((r) => `${r.title}\n${r.full_content ?? r.snippet}`)
      .join('\n\n---\n\n')
      .slice(0, 6000);

    const res = await fetch('/api/outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, audience, tone, research_summary: researchSummary }),
    });

    if (!res.ok || !res.body) {
      setError('Outline generation failed');
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const token = decoder.decode(value, { stream: true });
      accumulated += token;
      appendOutlineText(token);
    }

    try {
      const parsed: Outline = JSON.parse(accumulated);
      setOutline(parsed);
    } catch {
      setError('Failed to parse outline JSON from AI response');
    }

    setStreaming(false);
  }

  return { generateOutline };
}
