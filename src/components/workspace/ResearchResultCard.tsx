'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useResearch } from '@/hooks/useResearch';
import type { ResearchResult } from '@/lib/types';

interface Props {
  result: ResearchResult;
}

export function ResearchResultCard({ result }: Props) {
  const { toggleResearchSelected } = useWorkflowStore();
  const { scrapeResult } = useResearch();
  const [scraping, setScraping] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleScrape() {
    setScraping(true);
    await scrapeResult(result.id, result.url);
    setScraping(false);
    setOpen(true);
  }

  return (
    <>
      <Card className={`transition-colors cursor-pointer ${result.is_selected ? 'border-primary' : ''}`}
        onClick={() => toggleResearchSelected(result.id)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium line-clamp-2">{result.title}</CardTitle>
            <Badge variant={result.source === 'exa' ? 'default' : 'secondary'} className="shrink-0">
              {result.source === 'exa' ? 'Exa' : 'Google'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-3">{result.snippet}</p>
          <div className="flex items-center justify-between">
            <a href={result.url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-500 hover:underline truncate max-w-[60%]"
              onClick={(e) => e.stopPropagation()}>
              {result.url}
            </a>
            <Button size="sm" variant="outline"
              onClick={(e) => { e.stopPropagation(); result.full_content ? setOpen(true) : handleScrape(); }}
              disabled={scraping}>
              {scraping ? 'Scraping…' : result.full_content ? 'View' : 'Scrape'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="line-clamp-2">{result.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <pre className="text-sm whitespace-pre-wrap font-sans">{result.full_content}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
