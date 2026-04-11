'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { StreamingText } from '@/components/shared/StreamingText';
import { LoadingState } from '@/components/shared/LoadingState';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useDraft } from '@/hooks/useDraft';

interface Props {
  draftId: string | null;
  onDraftCreated?: (id: string) => void;
}

export function DraftEditor({ draftId, onDraftCreated }: Props) {
  const { projectId, draftText, setDraftText, isStreaming, setStep } = useWorkflowStore();
  const { generateDraft, wordCount } = useDraft(draftId);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!draftText && !isStreaming) {
      initDraft();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function initDraft() {
    // Create draft record first, then stream
    const res = await fetch(`/api/projects/${projectId}/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '', word_count: 0, version: 1 }),
    });
    if (res.ok) {
      const draft = await res.json();
      onDraftCreated?.(draft.id);
    }
    await generateDraft();
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraftText(e.target.value);
    setSaveStatus('idle');
  }

  const readingMins = Math.ceil(wordCount / 200);

  if (isStreaming && !draftText) {
    return <LoadingState variant="spinner" label="Writing draft with Claude…" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{wordCount} words</Badge>
          <Badge variant="outline">{readingMins} min read</Badge>
          {saveStatus === 'saving' && <Badge variant="secondary">Saving…</Badge>}
          {saveStatus === 'saved' && <Badge>Saved</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generateDraft} disabled={isStreaming}>
            Regenerate
          </Button>
          <Button size="sm" onClick={() => setStep('images')}>
            Generate Images →
          </Button>
        </div>
      </div>

      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          {isStreaming ? (
            <div className="min-h-[500px] rounded border p-3 font-mono text-sm whitespace-pre-wrap">
              <StreamingText text={draftText} isStreaming={isStreaming} />
            </div>
          ) : (
            <textarea
              className="w-full min-h-[500px] rounded border p-3 font-mono text-sm resize-y bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={draftText}
              onChange={handleChange}
            />
          )}
        </TabsContent>
        <TabsContent value="preview">
          <ScrollArea className="h-[500px] rounded border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{draftText}</ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
