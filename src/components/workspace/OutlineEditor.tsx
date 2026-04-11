'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StreamingText } from '@/components/shared/StreamingText';
import { LoadingState } from '@/components/shared/LoadingState';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useOutline } from '@/hooks/useOutline';

export function OutlineEditor() {
  const { outline, outlineText, isStreaming, setStep } = useWorkflowStore();
  const { generateOutline } = useOutline();

  useEffect(() => {
    if (!outline && !isStreaming && !outlineText) {
      generateOutline();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isStreaming && !outline) {
    return (
      <div className="space-y-4">
        <LoadingState variant="spinner" label="Generating outline with Groq…" />
        <div className="font-mono text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-auto border rounded p-3">
          <StreamingText text={outlineText} isStreaming={isStreaming} />
        </div>
      </div>
    );
  }

  if (!outline) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{outline.title}</h2>
          <p className="text-sm text-muted-foreground">{outline.meta_description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">~{outline.total_estimated_words} words</Badge>
          <Button size="sm" variant="outline" onClick={generateOutline} disabled={isStreaming}>
            Regenerate
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {outline.sections.map((section) => (
          <div key={section.id} className="space-y-1">
            <p className={`font-medium ${section.level === 1 ? 'text-base' : section.level === 2 ? 'text-sm' : 'text-xs'}`}>
              {'#'.repeat(section.level)} {section.heading}
              <span className="ml-2 text-xs text-muted-foreground font-normal">~{section.estimated_words}w</span>
            </p>
            <ul className="pl-4 space-y-0.5">
              {section.key_points.map((point, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={() => setStep('draft')}>
        Write Draft →
      </Button>
    </div>
  );
}
