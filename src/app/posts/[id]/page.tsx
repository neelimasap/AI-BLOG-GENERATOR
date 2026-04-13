'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Code, Check, Clock, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { toast } from 'sonner';

interface SavedPost {
  id: string;
  topic: string;
  tone: string;
  audience: string;
  outline: string;
  content: string;
  seo_meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  image_url?: string;
  sources: any[];
  created_at: string;
}

interface ParsedPost {
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

function wordCount(parsed: ParsedPost): number {
  const text = [parsed.intro, ...parsed.sections.map(s => s.content), parsed.conclusion].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

function postToMarkdown(parsed: ParsedPost): string {
  const lines = [
    `# ${parsed.title}`,
    '',
    parsed.intro,
    '',
    ...parsed.sections.flatMap(s => [`## ${s.heading}`, '', s.content, '']),
    '## Conclusion',
    '',
    parsed.conclusion,
  ];
  if (parsed.suggestions?.length) {
    lines.push('', '## Suggestions & Next Steps', '');
    parsed.suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  return lines.join('\n');
}

function postToHtml(parsed: ParsedPost): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = [
    `<h1>${escape(parsed.title)}</h1>`,
    `<p>${escape(parsed.intro)}</p>`,
    ...parsed.sections.map(s => `<h2>${escape(s.heading)}</h2>\n<p>${escape(s.content)}</p>`),
    `<h2>Conclusion</h2>\n<p>${escape(parsed.conclusion)}</p>`,
  ];
  if (parsed.suggestions?.length) {
    lines.push('<h2>Suggestions &amp; Next Steps</h2>', '<ol>');
    parsed.suggestions.forEach(s => lines.push(`  <li>${escape(s)}</li>`));
    lines.push('</ol>');
  }
  return lines.join('\n');
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [post, setPost] = useState<SavedPost | null>(null);
  const [parsed, setParsed] = useState<ParsedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'md' | 'html' | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then((data: SavedPost) => {
        setPost(data);
        try {
          setParsed(JSON.parse(data.outline));
        } catch {
          // outline is malformed — build a minimal parsed object from raw content
          setParsed({
            title: data.topic,
            intro: '',
            sections: [],
            conclusion: '',
            seo_meta: data.seo_meta,
          });
        }
      })
      .catch(() => router.push('/posts'))
      .finally(() => setLoading(false));
  }, [id]);

  async function copyAs(format: 'md' | 'html') {
    if (!parsed) return;
    const text = format === 'md' ? postToMarkdown(parsed) : postToHtml(parsed);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    toast.success(`Copied as ${format === 'md' ? 'Markdown' : 'HTML'}`);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deletePost() {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Post deleted');
      router.push('/posts');
    } else {
      toast.error('Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center font-sans text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post || !parsed) return null;

  const words = wordCount(parsed);
  const readMins = Math.max(1, Math.round(words / 200));
  const createdDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background py-10 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push('/posts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Posts
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyAs('md')}>
              {copied === 'md' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied === 'md' ? 'Copied!' : 'Copy MD'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => copyAs('html')}>
              {copied === 'html' ? <Check className="w-4 h-4 mr-1" /> : <Code className="w-4 h-4 mr-1" />}
              {copied === 'html' ? 'Copied!' : 'Copy HTML'}
            </Button>
            <Button variant="destructive" size="sm" onClick={deletePost}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hero image */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img src={post.image_url} alt={parsed.title} className="w-full h-72 object-cover" />
          </div>
        )}

        {/* Article */}
        <Card>
          <CardContent className="pt-10 pb-10 px-10">

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground font-sans">
              <Badge variant="outline" className="capitalize">{post.tone}</Badge>
              {post.audience && <span>{post.audience}</span>}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readMins} min read · {words.toLocaleString()} words
              </span>
              <span>{createdDate}</span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl font-bold mb-6 text-foreground leading-tight">
              {parsed.title}
            </h1>

            {/* Intro */}
            <p className="text-base text-foreground/80 leading-relaxed mb-10 border-l-4 border-primary pl-5 font-sans">
              {parsed.intro}
            </p>

            {/* Sections */}
            {parsed.sections.map((section, i) => (
              <div key={i} className="mb-10">
                <h2 className="text-xl font-semibold text-foreground font-sans mb-3">
                  {section.heading}
                </h2>
                <ReactMarkdown components={mdComponents}>{section.content}</ReactMarkdown>
              </div>
            ))}

            {/* Conclusion */}
            <div className="mt-10 p-6 bg-muted/50 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-2 font-sans">Conclusion</h3>
              <p className="text-foreground/80 leading-relaxed text-sm font-sans">{parsed.conclusion}</p>
            </div>

            {/* Suggestions */}
            {parsed.suggestions && parsed.suggestions.length > 0 && (
              <div className="mt-6 p-6 bg-primary/5 rounded-xl border border-primary/20">
                <h3 className="font-semibold text-foreground mb-3 font-sans">Suggestions & Next Steps</h3>
                <ul className="space-y-2">
                  {parsed.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80 text-sm font-sans">
                      <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SEO */}
            <div className="mt-10 pt-8 border-t border-border">
              <h3 className="font-semibold text-foreground mb-4 font-sans">SEO Meta</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Title</p>
                  <p className="text-sm text-foreground font-sans">{parsed.seo_meta.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Description</p>
                  <p className="text-sm text-foreground font-sans">{parsed.seo_meta.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-sans">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.seo_meta.keywords.map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-sans">{k}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sources */}
            {post.sources?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3 font-sans">Research Sources</h3>
                <ol className="space-y-2">
                  {post.sources.map((s: any, i: number) => (
                    <li key={i} className="text-sm font-sans">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
