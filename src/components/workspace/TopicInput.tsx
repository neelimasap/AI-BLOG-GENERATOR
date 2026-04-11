'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkflowStore } from '@/hooks/useWorkflowStore';
import type { Tone } from '@/lib/types';

export function TopicInput() {
  const router = useRouter();
  const { setProjectId, setTopic, setAudience, setTone, setWordCount, setStep } = useWorkflowStore();

  const [form, setForm] = useState({
    topic: '',
    audience: 'general readers',
    tone: 'professional' as Tone,
    target_word_count: 1500,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, title: form.topic.slice(0, 100) }),
    });

    if (!res.ok) { setLoading(false); return; }

    const project = await res.json();
    setProjectId(project.id);
    setTopic(form.topic);
    setAudience(form.audience);
    setTone(form.tone);
    setWordCount(form.target_word_count);
    setStep('research');

    router.push(`/projects/${project.id}`);
  }

  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle>New Blog Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              required
              placeholder="e.g. The future of renewable energy in 2025"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              value={form.audience}
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Tone</Label>
            <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v as Tone }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="words">Target Word Count: {form.target_word_count}</Label>
            <input
              id="words"
              type="range"
              min={300}
              max={5000}
              step={100}
              value={form.target_word_count}
              onChange={(e) => setForm((f) => ({ ...f, target_word_count: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Start Research →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
