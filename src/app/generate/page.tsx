'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, Loader2, Search, FileText, Image, Save,
  RotateCcw, Copy, Code, Pencil, RefreshCw, Check, Clock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { Tone } from '@/lib/types';
import { toast } from 'sonner';

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
  suggestions?: string[];
  seo_meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

interface BlogFormData {
  topic: string;
  audience: string;
  tone: Tone;
  customInstructions?: string;
}

interface SeoScore {
  overall_score: number;
  readability: {
    score: number;
    word_count: number;
    reading_time_minutes: number;
  };
  title: {
    length: number;
    recommendation: string;
  };
  description: {
    length: number;
    recommendation: string;
  };
  keywords: {
    density: Record<string, number>;
    recommendations: string[];
  };
}

interface CachedGenerationResult {
  post?: GeneratedPost;
  sources?: ResearchSource[];
  imageUrl?: string;
  seoScore?: SeoScore | null;
  rawText?: string;
}

const steps = [
  { id: 'research', label: 'Researching', icon: Search },
  { id: 'scraping', label: 'Scraping Sources', icon: FileText },
  { id: 'outlining', label: 'Creating Outline', icon: FileText },
  { id: 'writing', label: 'Writing Article', icon: FileText },
  { id: 'image', label: 'Generating Image', icon: Image },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
];

const CACHE_KEY = 'blogResult';
const FORM_KEY = 'blogForm';
const defaultFormData: BlogFormData = {
  topic: '',
  audience: 'general readers',
  tone: 'professional',
  customInstructions: '',
};

// Consistent sans-serif markdown renderers — no serif bleed from globals
const mdComponents: Components = {
  p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground/80 font-sans">{children}</p>,
  h2: ({ children }) => <h2 className="text-base font-semibold text-foreground font-sans mb-2 mt-4">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground font-sans mb-1 mt-3">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 font-sans">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 font-sans">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-foreground/80 font-sans">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>,
};

function wordCount(post: GeneratedPost): number {
  const text = [post.intro, ...post.sections.map(s => s.content), post.conclusion].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function readingTime(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

function postToMarkdown(post: GeneratedPost): string {
  const lines = [
    `# ${post.title}`,
    '',
    post.intro,
    '',
    ...post.sections.flatMap(s => [`## ${s.heading}`, '', s.content, '']),
    '## Conclusion',
    '',
    post.conclusion,
  ];
  if (post.suggestions?.length) {
    lines.push('', '## Suggestions & Next Steps', '');
    post.suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  return lines.join('\n');
}

function postToHtml(post: GeneratedPost): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = [
    `<h1>${escape(post.title)}</h1>`,
    `<p>${escape(post.intro)}</p>`,
    ...post.sections.map(s => `<h2>${escape(s.heading)}</h2>\n<p>${escape(s.content)}</p>`),
    `<h2>Conclusion</h2>\n<p>${escape(post.conclusion)}</p>`,
  ];
  if (post.suggestions?.length) {
    lines.push('<h2>Suggestions &amp; Next Steps</h2>', '<ol>');
    post.suggestions.forEach(s => lines.push(`  <li>${escape(s)}</li>`));
    lines.push('</ol>');
  }
  return lines.join('\n');
}

function parseStoredFormData(raw: string | null): BlogFormData {
  if (!raw) return defaultFormData;

  try {
    const parsed = JSON.parse(raw) as Partial<BlogFormData>;
    return {
      ...defaultFormData,
      ...parsed,
    };
  } catch {
    return defaultFormData;
  }
}

export default function GeneratePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('research');
  const [progress, setProgress] = useState(0);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [editablePost, setEditablePost] = useState<GeneratedPost | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formData, setFormData] = useState<BlogFormData>(defaultFormData);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState<'md' | 'html' | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const storedFormData = parseStoredFormData(localStorage.getItem(FORM_KEY));
    setFormData(storedFormData);

    if (!storedFormData.topic) {
      router.push('/');
      return;
    }

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const {
          post: cachedPost,
          sources: cachedSources,
          imageUrl: cachedImage,
          seoScore: cachedSeo,
          rawText,
        } = JSON.parse(cached) as CachedGenerationResult;
        if (cachedPost?.title) {
          setEditablePost(cachedPost);
          setSources(cachedSources || []);
          setImageUrl(cachedImage || '');
          setSeoScore(cachedSeo || null);
          setStreamingText(rawText || '');
          setCurrentStep('complete');
          setProgress(100);
          return;
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    startGeneration(storedFormData);
  }, [router]);

  async function startGeneration(data: BlogFormData) {
    try {
      setCurrentStep('research');
      setProgress(20);

      const researchRes = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: data.topic, num_results: 8 }),
      });
      if (!researchRes.ok) throw new Error('Research failed');
      const { sources: researchSources } = await researchRes.json();
      setSources(researchSources);

      setCurrentStep('scraping');
      setProgress(40);

      // Scrape top 5 in parallel — non-blocking, fall back to snippet if timeout
      const topSources = researchSources.slice(0, 5);
      const scrapePromises = topSources.map(async (source: ResearchSource) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const { content } = await res.json();
            return { ...source, content };
          }
        } catch {
          clearTimeout(timer);
        }
        return source; // falls back to snippet from research
      });

      const scrapedSources = await Promise.all(scrapePromises);
      // Merge: scraped top 5 + remaining sources with snippets for full context
      const remainingSources = researchSources.slice(5);
      const allSources = [...scrapedSources, ...remainingSources];
      setSources(allSources);

      setCurrentStep('outlining');
      setProgress(60);
      setCurrentStep('writing');
      setProgress(70);

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: data.topic,
          audience: data.audience,
          tone: data.tone,
          research_sources: allSources,
        }),
      });
      if (!generateRes.ok) {
        const errData = await generateRes.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(errData.error || 'Generation failed');
      }

      const generatedPost: GeneratedPost = await generateRes.json();
      setStreamingText(JSON.stringify(generatedPost));
      setEditablePost(generatedPost);

      setCurrentStep('image');
      setProgress(90);

      let finalImageUrl = '';
      const imageRes = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Header image for blog post: ${generatedPost.title}`, style: 'photorealistic' }),
      });
      if (imageRes.ok) {
        const imageData = await imageRes.json();
        finalImageUrl = imageData.url;
        setImageUrl(finalImageUrl);
      }

      let finalSeo = null;
      const seoRes = await fetch('/api/seo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedPost.intro + ' ' + generatedPost.sections.map((s) => s.content).join(' '),
          title: generatedPost.seo_meta.title,
          description: generatedPost.seo_meta.description,
          keywords: generatedPost.seo_meta.keywords,
        }),
      });
      if (seoRes.ok) {
        finalSeo = await seoRes.json();
        setSeoScore(finalSeo);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        post: generatedPost,
        sources: allSources,
        imageUrl: finalImageUrl,
        seoScore: finalSeo,
        rawText: JSON.stringify(generatedPost),
      }));

      setCurrentStep('complete');
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  }

  async function regenerateSection(index: number) {
    if (!editablePost) return;
    setRegeneratingSection(index);
    const section = editablePost.sections[index];
    try {
      const res = await fetch('/api/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading: section.heading,
          current_content: section.content,
          topic: formData.topic,
          tone: formData.tone,
        }),
      });
      if (!res.ok) throw new Error('Regeneration failed');
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let newContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        newContent += decoder.decode(value, { stream: true });
        setEditablePost(prev => {
          if (!prev) return prev;
          const sections = prev.sections.map((s, i) =>
            i === index ? { ...s, content: newContent } : s
          );
          return { ...prev, sections };
        });
      }
    } catch {
      // silently fail — section stays as-is
    } finally {
      setRegeneratingSection(null);
    }
  }

  function regenerate() {
    localStorage.removeItem(CACHE_KEY);
    setEditablePost(null);
    setSources([]);
    setImageUrl('');
    setSeoScore(null);
    setStreamingText('');
    setError('');
    setEditMode(false);
    setCurrentStep('research');
    setProgress(0);
    startGeneration(formData);
  }

  async function copyAs(format: 'md' | 'html') {
    if (!editablePost) return;
    const text = format === 'md' ? postToMarkdown(editablePost) : postToHtml(editablePost);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  }

  async function savePost() {
    if (!editablePost) { toast.error('No post to save'); return; }
    setSaving(true);
    try {
      const serializedPost = JSON.stringify(editablePost);
      const payload = {
        topic: formData.topic,
        tone: formData.tone,
        audience: formData.audience,
        outline: serializedPost,
        content: postToMarkdown(editablePost),
        seo_meta: editablePost.seo_meta,
        image_url: imageUrl || undefined,
        sources,
      };
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(`Save failed: ${JSON.stringify(err)}`);
        toast.error(`Save failed: ${JSON.stringify(err)}`);
        return;
      }
      await res.json();
      localStorage.removeItem(CACHE_KEY);
      toast.success('Post saved!');
      router.push('/posts');
    } catch (e) {
      setError(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isComplete = currentStep === 'complete';
  const displayPost = editablePost;
  const words = displayPost ? wordCount(displayPost) : 0;
  const readMins = readingTime(words);

  return (
    <div className="min-h-screen bg-background py-10 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-1 text-foreground">
            {isComplete ? formData.topic : `Generating: ${formData.topic}`}
          </h1>
          {!isComplete && (
            <p className="text-muted-foreground text-sm mb-4 font-sans">
              {steps[currentStepIndex]?.label || 'Processing...'}
              {currentStep === 'writing' && (
                <span className="ml-2 text-primary font-medium">Streaming live...</span>
              )}
            </p>
          )}
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index < currentStepIndex || isComplete;
                  const isCurrent = index === currentStepIndex && !isComplete;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`p-1 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        isCurrent ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> :
                         isCurrent ? <Loader2 className="w-4 h-4 animate-spin" /> :
                         <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm font-sans ${
                        isCompleted ? 'text-green-600 dark:text-green-400' :
                        isCurrent ? 'text-primary font-medium' :
                        'text-muted-foreground'
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Word count + reading time */}
            {displayPost && (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-sans">
                    <Clock className="w-4 h-4" />
                    <span>{words.toLocaleString()} words · {readMins} min read</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {sources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans">Sources ({sources.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sources.slice(0, 5).map((source, i) => (
                      <div key={i} className="text-sm">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium leading-snug block font-sans"
                        >
                          {source.title}
                        </a>
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2 font-sans">
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
          <div className="lg:col-span-3 space-y-6">
            {error && (
              <Card className="border-destructive/50">
                <CardContent className="pt-6">
                  <p className="text-destructive font-sans">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={regenerate}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Streaming preview */}
            {currentStep === 'writing' && !displayPost && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans">Writing in progress...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-sm whitespace-pre-wrap min-h-[200px] p-4 bg-muted rounded-lg">
                    {streamingText}
                    <span className="animate-pulse">|</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Post */}
            {displayPost && (
              <>
                {imageUrl && (
                  <div className="rounded-xl overflow-hidden">
                    <img src={imageUrl} alt={displayPost.title} className="w-full h-64 object-cover" />
                  </div>
                )}

                {/* Article body */}
                <Card>
                  <CardContent className="pt-8 pb-8 px-8">

                    {/* Title */}
                    {editMode ? (
                      <input
                        className="font-heading text-3xl font-bold mb-6 text-foreground leading-tight w-full bg-transparent border-b border-border focus:outline-none focus:border-primary pb-1"
                        value={displayPost.title}
                        onChange={e => setEditablePost(p => p ? { ...p, title: e.target.value } : p)}
                      />
                    ) : (
                      <h1 className="font-heading text-3xl font-bold mb-6 text-foreground leading-tight">
                        {displayPost.title}
                      </h1>
                    )}

                    {/* Intro */}
                    {editMode ? (
                      <textarea
                        className="text-base text-foreground/80 leading-relaxed mb-8 border-l-4 border-primary pl-4 w-full bg-transparent focus:outline-none resize-none font-sans"
                        rows={4}
                        value={displayPost.intro}
                        onChange={e => setEditablePost(p => p ? { ...p, intro: e.target.value } : p)}
                      />
                    ) : (
                      <p className="text-base text-foreground/80 leading-relaxed mb-8 border-l-4 border-primary pl-4 font-sans">
                        {displayPost.intro}
                      </p>
                    )}

                    {/* Sections */}
                    {displayPost.sections.map((section, i) => (
                      <div key={i} className="mb-8">
                        <div className="flex items-center justify-between mb-3 gap-2">
                          {editMode ? (
                            <input
                              className="text-xl font-semibold text-foreground font-sans w-full bg-transparent border-b border-border focus:outline-none focus:border-primary"
                              value={section.heading}
                              onChange={e => setEditablePost(p => {
                                if (!p) return p;
                                const sections = p.sections.map((s, si) =>
                                  si === i ? { ...s, heading: e.target.value } : s
                                );
                                return { ...p, sections };
                              })}
                            />
                          ) : (
                            <h2 className="text-xl font-semibold text-foreground font-sans">{section.heading}</h2>
                          )}
                          <button
                            onClick={() => regenerateSection(i)}
                            disabled={regeneratingSection !== null}
                            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 font-sans"
                            title="Regenerate this section"
                          >
                            {regeneratingSection === i
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RefreshCw className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Regenerate</span>
                          </button>
                        </div>

                        {editMode ? (
                          <textarea
                            className="text-sm text-foreground/80 leading-relaxed w-full bg-transparent focus:outline-none resize-none font-sans border border-border rounded-lg p-3 focus:border-primary"
                            rows={8}
                            value={section.content}
                            onChange={e => setEditablePost(p => {
                              if (!p) return p;
                              const sections = p.sections.map((s, si) =>
                                si === i ? { ...s, content: e.target.value } : s
                              );
                              return { ...p, sections };
                            })}
                          />
                        ) : (
                          <div>
                            <ReactMarkdown components={mdComponents}>{section.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Conclusion */}
                    <div className="mt-8 p-5 bg-muted/50 rounded-xl border border-border">
                      <h3 className="font-semibold text-foreground mb-2 font-sans">Conclusion</h3>
                      {editMode ? (
                        <textarea
                          className="text-foreground/80 leading-relaxed w-full bg-transparent focus:outline-none resize-none text-sm font-sans"
                          rows={4}
                          value={displayPost.conclusion}
                          onChange={e => setEditablePost(p => p ? { ...p, conclusion: e.target.value } : p)}
                        />
                      ) : (
                        <p className="text-foreground/80 leading-relaxed text-sm font-sans">{displayPost.conclusion}</p>
                      )}
                    </div>

                    {/* Suggestions */}
                    {displayPost.suggestions && displayPost.suggestions.length > 0 && (
                      <div className="mt-6 p-5 bg-primary/5 rounded-xl border border-primary/20">
                        <h3 className="font-semibold text-foreground mb-3 font-sans">Suggestions & Next Steps</h3>
                        <ul className="space-y-2">
                          {displayPost.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm font-sans">
                              <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SEO Meta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-sans">SEO Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Title</p>
                      <p className="text-sm text-foreground font-sans">{displayPost.seo_meta.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Description</p>
                      <p className="text-sm text-foreground font-sans">{displayPost.seo_meta.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {displayPost.seo_meta.keywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-sans">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Score */}
                {seoScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-sans">
                        SEO Score
                        <Badge variant={seoScore.overall_score >= 80 ? 'default' : 'secondary'}>
                          {seoScore.overall_score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                        <div>
                          <p className="font-medium text-foreground">Readability</p>
                          <p className="text-muted-foreground">{seoScore.readability.score}/100</p>
                          <p className="text-muted-foreground text-xs">
                            {seoScore.readability.word_count} words · {seoScore.readability.reading_time_minutes} min read
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Title</p>
                          <p className="text-muted-foreground">{seoScore.title.length} chars</p>
                          <p className="text-muted-foreground text-xs">{seoScore.title.recommendation}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Description</p>
                          <p className="text-muted-foreground">{seoScore.description.length} chars</p>
                          <p className="text-muted-foreground text-xs">{seoScore.description.recommendation}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Keywords</p>
                          <p className="text-muted-foreground">{Object.keys(seoScore.keywords.density).length} tracked</p>
                          {seoScore.keywords.recommendations.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {seoScore.keywords.recommendations[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={savePost} className="flex-1 min-w-[120px]" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Post'}
                  </Button>
                  <Button
                    variant={editMode ? 'default' : 'outline'}
                    onClick={() => setEditMode(m => !m)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {editMode ? 'Done Editing' : 'Edit'}
                  </Button>
                  <Button variant="outline" onClick={() => copyAs('md')}>
                    {copied === 'md' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied === 'md' ? 'Copied!' : 'Copy MD'}
                  </Button>
                  <Button variant="outline" onClick={() => copyAs('html')}>
                    {copied === 'html' ? <Check className="w-4 h-4 mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                    {copied === 'html' ? 'Copied!' : 'Copy HTML'}
                  </Button>
                  <Button variant="outline" onClick={regenerate}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/')}>
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
