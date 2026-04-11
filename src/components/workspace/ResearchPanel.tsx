'use client';

import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResearchResultCard } from './ResearchResultCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useResearch } from '@/hooks/useResearch';

export function ResearchPanel() {
  const { topic, researchResults, isStreaming, setStep } = useWorkflowStore();
  const { runResearch } = useResearch();

  const exaResults = researchResults.filter((r) => r.source === 'exa');
  const serpResults = researchResults.filter((r) => r.source === 'serp');
  const selectedCount = researchResults.filter((r) => r.is_selected).length;

  useEffect(() => {
    if (topic && researchResults.length === 0) {
      runResearch(topic);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Research</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{selectedCount} selected</Badge>
          <Button size="sm" variant="outline" onClick={() => runResearch(topic)} disabled={isStreaming}>
            Refresh
          </Button>
        </div>
      </div>

      {isStreaming && researchResults.length === 0 ? (
        <LoadingState label="Searching the web…" rows={4} />
      ) : (
        <Tabs defaultValue="exa" className="flex-1 flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="exa" className="flex-1">Exa ({exaResults.length})</TabsTrigger>
            <TabsTrigger value="serp" className="flex-1">Google ({serpResults.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="exa" className="flex-1">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-2">
                {exaResults.map((r) => <ResearchResultCard key={r.id} result={r} />)}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="serp" className="flex-1">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 pr-2">
                {serpResults.map((r) => <ResearchResultCard key={r.id} result={r} />)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

      <Button
        className="w-full"
        disabled={selectedCount === 0 || isStreaming}
        onClick={() => setStep('outline')}>
        Generate Outline with {selectedCount} Sources →
      </Button>
    </div>
  );
}
