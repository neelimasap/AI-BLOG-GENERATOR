'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/shared/LoadingState';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import type { ImageStyle } from '@/lib/types';

export function ImageGallery() {
  const { images, draftText, setDraftText } = useWorkflowStore();
  const { generateImage } = useImageGeneration();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!prompt) return;
    setGenerating(true);
    await generateImage(prompt, style);
    setGenerating(false);
    setPrompt('');
  }

  function insertIntoDraft(url: string, altText: string) {
    setDraftText(draftText + `\n\n![${altText}](${url})\n`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label>Image Prompt</Label>
          <Input
            placeholder="e.g. Solar panels on a rooftop at sunset"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="w-40 space-y-1">
          <Label>Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as ImageStyle)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="photorealistic">Photo</SelectItem>
              <SelectItem value="illustration">Illustration</SelectItem>
              <SelectItem value="diagram">Diagram</SelectItem>
              <SelectItem value="infographic">Infographic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleGenerate} disabled={!prompt || generating}>
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>

      {generating && <LoadingState variant="spinner" label="Generating image with Fal.ai…" />}

      <div className="grid grid-cols-2 gap-3">
        {images.map((img) => (
          <Card key={img.id}>
            <CardContent className="p-2 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.prompt} className="w-full rounded object-cover aspect-video" />
              <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
              <Button size="sm" variant="outline" className="w-full"
                onClick={() => insertIntoDraft(img.url, img.prompt)}>
                Insert into Draft
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
