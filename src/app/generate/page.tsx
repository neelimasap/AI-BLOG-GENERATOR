'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2, Search, FileText, Image, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Tone } from '@/lib/types';

interface ResearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

interface GeneratedPost {
  title: string;
  intro: string;
  sections: Array<{ heading: string; content: string }>;
  conclusion: string;
  seo_meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

const steps = [
  { id: 'research', label: 'Researching', icon: Search },
  { id: 'scraping', label: 'Scraping Sources', icon: FileText },
  { id: 'outlining', label: 'Creating Outline', icon: FileText },
  { id: 'writing', label: 'Writing Article', icon: FileText },
  { id: 'image', label: 'Generating Image', icon: Image },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
];

export default function GeneratePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('research');
  const [progress, setProgress] = useState(0);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [post, setPost] = useState<GeneratedPost | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [seoScore, setSeoScore] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const storedFormData = JSON.parse(localStorage.getItem('blogForm') || '{}');
    setFormData(storedFormData);

    if (!storedFormData.topic) {
      router.push('/');
      return;
    }
    startGeneration(storedFormData);
  }, []);

  async function startGeneration(formData: any) {
    try {
      // Step 1: Research
      setCurrentStep('research');
      setProgress(20);

      const researchRes = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: formData.topic, num_results: 8 }),
      });

      if (!researchRes.ok) throw new Error('Research failed');
      const { sources: researchSources } = await researchRes.json();
      setSources(researchSources);

      // Step 2: Scrape top 3 sources
      setCurrentStep('scraping');
      setProgress(40);

      const topSources = researchSources.slice(0, 3);
      const scrapePromises = topSources.map(async (source: ResearchSource) => {
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url }),
          });
          if (res.ok) {
            const { content } = await res.json();
            return { ...source, content };
          }
        } catch (e) {
          console.error('Scrape failed for', source.url);
        }
        return source;
      });

      const scrapedSources = await Promise.all(scrapePromises);
      setSources(scrapedSources);

      // Step 3: Generate outline (built into generate API)
      setCurrentStep('outlining');
      setProgress(60);

      // Step 4: Generate full post
      setCurrentStep('writing');
      setProgress(70);

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          audience: formData.audience,
          tone: formData.tone,
          research_sources: scrapedSources,
        }),
      });

      if (!generateRes.ok) throw new Error('Generation failed');

      const reader = generateRes.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingText(accumulated);
      }

      const cleaned = accumulated.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const generatedPost: GeneratedPost = JSON.parse(cleaned);
      setPost(generatedPost);

      // Step 5: Generate image
      setCurrentStep('image');
      setProgress(90);

      const imageRes = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Header image for blog post: ${generatedPost.title}`,
          style: 'photorealistic',
        }),
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        setImageUrl(imageData.url);
      }

      // Step 6: SEO check
      const seoRes = await fetch('/api/seo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: accumulated,
          title: generatedPost.seo_meta.title,
          description: generatedPost.seo_meta.description,
          keywords: generatedPost.seo_meta.keywords,
        }),
      });

      if (seoRes.ok) {
        const seoData = await seoRes.json();
        setSeoScore(seoData);
      }

      // Complete
      setCurrentStep('complete');
      setProgress(100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  }

  async function savePost() {
    if (!post) return;

    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          tone: formData.tone,
          audience: formData.audience,
          outline: JSON.stringify(post),
          content: streamingText,
          seo_meta: post.seo_meta,
          image_url: imageUrl,
          sources: sources,
        }),
      });

      router.push('/posts');
    } catch (err) {
      setError('Failed to save post');
    }
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const CurrentIcon = steps[currentStepIndex]?.icon || Clock;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generating: {formData.topic}</h1>
          <Progress value={progress} className="mb-4" />

          <div className="flex items-center gap-2 mb-4">
            <CurrentIcon className="w-5 h-5" />
            <span className="font-medium">
              {steps[currentStepIndex]?.label || 'Processing...'}
            </span>
            {currentStep === 'writing' && (
              <Badge variant="secondary">Streaming live...</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${
                        isCompleted ? 'bg-green-100 text-green-600' :
                        isCurrent ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        isCompleted ? 'text-green-600' :
                        isCurrent ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Sources */}
            {sources.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Research Sources ({sources.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sources.slice(0, 5).map((source, i) => (
                      <div key={i} className="text-sm">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {source.title}
                        </a>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {source.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-4 border-red-200">
                <CardContent className="pt-6">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Content */}
            {post && (
              <Card>
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg mt-4"
                    />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg font-medium mb-4">{post.intro}</p>

                    {post.sections.map((section, i) => (
                      <div key={i} className="mb-6">
                        <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                        <div className="text-gray-700 dark:text-gray-300">
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-semibold mb-2">Conclusion</h3>
                      <p>{post.conclusion}</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-semibold mb-2">SEO Meta</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Title:</strong> {post.seo_meta.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Description:</strong> {post.seo_meta.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {post.seo_meta.keywords.map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {seoScore && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        SEO Score
                        <Badge variant={seoScore.overall_score >= 80 ? "default" : "secondary"}>
                          {seoScore.overall_score}/100
                        </Badge>
                      </h3>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Readability</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Score: {seoScore.readability.score}/100
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {seoScore.readability.word_count} words, {seoScore.readability.reading_time_minutes} min read
                          </p>
                        </div>

                        <div>
                          <p className="font-medium">Title</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {seoScore.title.length} chars
                          </p>
                          <p className="text-xs text-gray-500">{seoScore.title.recommendation}</p>
                        </div>

                        <div>
                          <p className="font-medium">Description</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {seoScore.description.length} chars
                          </p>
                          <p className="text-xs text-gray-500">{seoScore.description.recommendation}</p>
                        </div>

                        <div>
                          <p className="font-medium">Keywords</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {Object.keys(seoScore.keywords.density).length} keywords
                          </p>
                          {seoScore.keywords.recommendations.length > 0 && (
                            <p className="text-xs text-orange-600">
                              {seoScore.keywords.recommendations[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button onClick={savePost} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save Post
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')}>
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Streaming preview during writing */}
            {currentStep === 'writing' && !post && (
              <Card>
                <CardHeader>
                  <CardTitle>Writing in progress...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm whitespace-pre-wrap min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    {streamingText}
                    <span className="animate-pulse">|</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}