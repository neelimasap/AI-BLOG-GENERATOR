'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Trash2, FileText, PenLine, Clock, Sparkles, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SavedSource {
  title: string;
  url: string;
  snippet?: string;
  content?: string | null;
}

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
  sources: SavedSource[];
  created_at: string;
}

function parseOutline(raw: string) {
  try { return JSON.parse(raw); } catch { return {}; }
}

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    try {
      const res = await fetch(`/api/posts?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) setPosts(await res.json());
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(p => p.filter(x => x.id !== id));
        toast.success('Post deleted');
      }
    } catch { toast.error('Failed to delete post'); }
  }

  function copyTitle(e: React.MouseEvent, title: string) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(title);
    toast.success('Title copied');
  }

  function exportMarkdown(e: React.MouseEvent, post: SavedPost) {
    e.preventDefault();
    e.stopPropagation();
    const outline = parseOutline(post.outline);
    const md = `# ${outline.title || post.topic}\n\n${post.content}\n\n---\n\n**SEO Title:** ${post.seo_meta.title}\n**Keywords:** ${post.seo_meta.keywords.join(', ')}`;
    navigator.clipboard.writeText(md);
    toast.success('Markdown copied');
  }

  async function generateCoverImage(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setGeneratingImageId(id);

    try {
      const res = await fetch(`/api/posts/${id}/image`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
        throw new Error(err.error || 'Image generation failed');
      }

      const updatedPost: SavedPost = await res.json();
      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === id ? updatedPost : post
      )));
      toast.success('Cover image generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImageId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-sans text-sm tracking-wide">Loading your posts…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Soft radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(28 100% 51% / 0.12), transparent)' }} />
        <div className="relative container mx-auto px-6 max-w-6xl py-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">AI Blog Generator</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Your Published<br />
              <span className="text-primary">Writings</span>
            </h1>
            <p className="mt-3 text-muted-foreground text-base">
              {posts.length} post{posts.length !== 1 ? 's' : ''} crafted with AI
            </p>
          </div>
          <Button
            size="lg"
            className="flex items-center gap-2 shadow-lg shrink-0"
            onClick={() => router.push('/')}
          >
            <PenLine className="w-4 h-4" />
            Create New Post
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-6 max-w-6xl py-12">
        {!posts.length ? (
          <div className="flex flex-col items-center text-center py-32 gap-5">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <FileText className="w-9 h-9 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
              <p className="text-muted-foreground max-w-sm">
                Generate your first AI-powered blog post to see it here.
              </p>
            </div>
            <Button size="lg" onClick={() => router.push('/')}>Generate Your First Post</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, idx) => {
              const outline = parseOutline(post.outline);
              const title = outline.title || post.topic;
              const mins = readingTime(post.content);
              const isFeatured = idx === 0;

              return (
                <div
                  key={post.id}
                  className={`group relative flex flex-col rounded-2xl bg-card ring-1 ring-foreground/8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-primary/30 ${isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}`}
                >
                  {/* Image */}
                  <div className="block relative overflow-hidden">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={title}
                        className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isFeatured ? 'h-72 md:h-80' : 'h-52'}`}
                      />
                    ) : (
                      <div className={`w-full flex items-center justify-center bg-muted ${isFeatured ? 'h-72 md:h-80' : 'h-52'}`}>
                        <FileText className="w-12 h-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                    {/* Tone badge floating on image */}
                    <span className="absolute top-3 left-3 capitalize text-xs font-semibold px-3 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-foreground">
                      {post.tone}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col p-5 gap-3">
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(post.created_at)}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mins} min read
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className={`font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                      {title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{post.seo_meta.description}</p>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5">
                      {post.seo_meta.keywords.slice(0, isFeatured ? 5 : 3).map((k, i) => (
                        <Badge key={i} variant="secondary" className="text-xs rounded-full px-2.5">{k}</Badge>
                      ))}
                      {post.seo_meta.keywords.length > (isFeatured ? 5 : 3) && (
                        <Badge variant="secondary" className="text-xs rounded-full px-2.5">
                          +{post.seo_meta.keywords.length - (isFeatured ? 5 : 3)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="flex gap-2 px-5 pb-5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={(e) => generateCoverImage(e, post.id)}
                      disabled={generatingImageId === post.id}
                    >
                      {generatingImageId === post.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ImagePlus className="w-3 h-3" />
                      )}
                      {post.image_url ? 'Refresh Image' : 'Add Image'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={(e) => copyTitle(e, title)}
                    >
                      <Copy className="w-3 h-3" /> Copy Title
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={(e) => exportMarkdown(e, post)}
                    >
                      <ExternalLink className="w-3 h-3" /> MD
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => deletePost(e, post.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
