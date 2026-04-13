'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Tone } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    topic: '',
    audience: 'general readers',
    tone: 'professional' as Tone,
    customInstructions: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Clear any cached result so new topic generates fresh
    localStorage.removeItem('blogResult');
    localStorage.setItem('blogForm', JSON.stringify(form));
    router.push('/generate');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Blog Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Create engaging blog posts with AI-powered research and writing
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Start Your Blog Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="topic">Topic *</Label>
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
                  placeholder="e.g. tech professionals, small business owners"
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Tone</Label>
                <Select
                  value={form.tone}
                  onValueChange={(v) => setForm((f) => ({ ...f, tone: v as Tone }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requirements or focus areas..."
                  value={form.customInstructions}
                  onChange={(e) => setForm((f) => ({ ...f, customInstructions: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Starting...' : 'Generate Blog Post →'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
