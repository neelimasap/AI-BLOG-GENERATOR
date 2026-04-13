'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Trash2, FileText } from 'lucide-react';
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

function parseOutline(raw: string) {
  try { return JSON.parse(raw); } catch { return {}; }
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-sans">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 font-sans">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Blog Posts</h1>
            <p className="text-muted-foreground mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''} saved</p>
          </div>
          <Button onClick={() => router.push('/')}>Create New Post</Button>
        </div>

        {!posts.length ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground mb-6">Generate your first blog post to get started.</p>
            <Button onClick={() => router.push('/')}>Generate Blog Post</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const outline = parseOutline(post.outline);
              const title = outline.title || post.topic;
              const createdDate = new Date(post.created_at).toLocaleDateString();

              return (
                <Card
                  key={post.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
                  <CardHeader className="pb-3">
                    {post.image_url && (
                      <img src={post.image_url} alt={title} className="w-full h-32 object-cover rounded-t-lg mb-3" />
                    )}
                    <CardTitle className="text-lg line-clamp-2 font-sans">{title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize">{post.tone}</Badge>
                      <span>{createdDate}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.seo_meta.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.seo_meta.keywords.slice(0, 3).map((k, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                      ))}
                      {post.seo_meta.keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{post.seo_meta.keywords.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={(e) => copyTitle(e, title)}>
                        <Copy className="w-3 h-3 mr-1" />Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => exportMarkdown(e, post)}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={(e) => deletePost(e, post.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
