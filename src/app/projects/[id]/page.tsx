'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResearchPanel } from '@/components/workspace/ResearchPanel';
import { OutlineEditor } from '@/components/workspace/OutlineEditor';
import { DraftEditor } from '@/components/workspace/DraftEditor';
import { ImageGallery } from '@/components/workspace/ImageGallery';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';

export default function ProjectWorkspacePage() {
  const { step, setStep } = useWorkflowStore();
  const [draftId, setDraftId] = useState<string | null>(null);

  const steps = ['research', 'outline', 'draft', 'images'] as const;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
        <TabsList className="w-full mb-6">
          {steps.map((s) => (
            <TabsTrigger key={s} value={s} className="flex-1 capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="research">
          <ResearchPanel />
        </TabsContent>

        <TabsContent value="outline">
          <OutlineEditor />
        </TabsContent>

        <TabsContent value="draft">
          <DraftEditor draftId={draftId} onDraftCreated={setDraftId} />
        </TabsContent>

        <TabsContent value="images">
          <ImageGallery />
        </TabsContent>
      </Tabs>
    </main>
  );
}
