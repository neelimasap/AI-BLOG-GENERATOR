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
    localStorage.setItem('blogForm', JSON.stringify(form));
    router.push('/generate');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        
        {/* Hero — увеличенные шрифты */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
            AI Blog Generator
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Create engaging blog posts with AI-powered research and writing
          </p>
        </div>

        <Card className="max-w-lg mx-auto shadow-lg">
          <CardHeader className="pb-4">
            {/* Увеличенный заголовок карточки */}
            <CardTitle className="text-2xl md:text-3xl font-semibold">
              Start Your Blog Post
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Topic — крупнее лейбл и инпут */}
              <div className="space-y-2.5">
                <Label htmlFor="topic" className="text-base font-medium">
                  Topic <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="topic"
                  required
                  placeholder="e.g. The future of renewable energy in 2025"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="text-base py-2.5 h-auto placeholder:text-base"
                />
              </div>

              {/* Audience */}
              <div className="space-y-2.5">
                <Label htmlFor="audience" className="text-base font-medium">
                  Target Audience
                </Label>
                <Input
                  id="audience"
                  placeholder="e.g. tech professionals, small business owners"
                  value={form.audience}
                  onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}
                  className="text-base py-2.5 h-auto placeholder:text-base"
                />
              </div>

              {/* Tone */}
              <div className="space-y-2.5">
                <Label className="text-base font-medium">Tone</Label>
                <Select
                  value={form.tone}
                  onValueChange={(v) => setForm((f) => ({ ...f, tone: v as Tone }))}
                >
                  <SelectTrigger className="text-base py-2.5 h-auto">
                    <SelectValue placeholder="Select tone" className="text-base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional" className="text-base py-2">Professional</SelectItem>
                    <SelectItem value="conversational" className="text-base py-2">Conversational</SelectItem>
                    <SelectItem value="technical" className="text-base py-2">Technical</SelectItem>
                    <SelectItem value="casual" className="text-base py-2">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instructions — крупнее текстареа */}
              <div className="space-y-2.5">
                <Label htmlFor="instructions" className="text-base font-medium">
                  Custom Instructions <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requirements or focus areas..."
                  value={form.customInstructions}
                  onChange={(e) => setForm((f) => ({ ...f, customInstructions: e.target.value }))}
                  rows={4}
                  className="text-base py-2.5 h-auto placeholder:text-base leading-relaxed"
                />
              </div>

              {/* Кнопка — крупнее текст и паддинги */}
              <Button 
                type="submit" 
                className="w-full text-base font-medium py-3 h-auto" 
                size="lg" 
                disabled={loading}
              >
                {loading ? 'Starting...' : 'Generate Blog Post →'}
              </Button>
              
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
