'use client';

import { useWorkflowStore } from './useWorkflowStore';

export function useResearch() {
  const { setStreaming, setError, addResearchResult, setFullContent } = useWorkflowStore();

  async function runResearch(query: string) {
    setStreaming(true);
    setError(null);

    const [exaRes, serpRes] = await Promise.allSettled([
      fetch('/api/research/exa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num_results: 8 }),
      }).then((r) => r.json()),
      fetch('/api/research/serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num_results: 8 }),
      }).then((r) => r.json()),
    ]);

    if (exaRes.status === 'fulfilled' && Array.isArray(exaRes.value)) {
      exaRes.value.forEach(addResearchResult);
    }
    if (serpRes.status === 'fulfilled' && Array.isArray(serpRes.value)) {
      serpRes.value.forEach(addResearchResult);
    }
    if (exaRes.status === 'rejected' && serpRes.status === 'rejected') {
      setError('Both research sources failed. Check your API keys.');
    }

    setStreaming(false);
  }

  async function scrapeResult(id: string, url: string) {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return;
    const { content } = await res.json();
    if (content) setFullContent(id, content);
  }

  return { runResearch, scrapeResult };
}
