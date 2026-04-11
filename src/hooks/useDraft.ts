'use client';

import { useEffect, useRef } from 'react';
import { useWorkflowStore } from './useWorkflowStore';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useDraft(draftId: string | null) {
  const { projectId, outline, researchResults, tone, wordCount, draftText, appendDraftText, setStreaming, setError } =
    useWorkflowStore();

  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;

  // Auto-save every 30s
  useEffect(() => {
    if (!draftIdRef.current || !projectId || !draftText) return;
    const timer = setInterval(() => {
      fetch(`/api/projects/${projectId}/drafts/${draftIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draftText, word_count: countWords(draftText) }),
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, [draftText, projectId]);

  async function generateDraft() {
    if (!outline || !projectId) {
      setError('Outline and project required before generating draft');
      return;
    }

    setStreaming(true);
    setError(null);

    const researchContext = researchResults
      .filter((r) => r.is_selected)
      .map((r) => `## ${r.title}\n${r.full_content ?? r.snippet}`)
      .join('\n\n')
      .slice(0, 16000);

    const res = await fetch('/api/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outline,
        research_context: researchContext,
        tone,
        word_count: wordCount,
        project_id: projectId,
      }),
    });

    if (!res.ok || !res.body) {
      setError('Draft generation failed');
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      appendDraftText(decoder.decode(value, { stream: true }));
    }

    setStreaming(false);
  }

  return { generateDraft, wordCount: countWords(draftText) };
}
