'use client';

import { useState, useEffect } from 'react';
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

export default function PostsPage() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== id));
        toast.success('Post deleted successfully');
      }
    } catch (err) {
      toast.error('Failed to delete post');
    }
  }

  function copyToClipboard(text: string, type: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  }

  function exportAsMarkdown(post: SavedPost) {
    const outline = JSON.parse(post.outline);
    const markdown = `# ${outline.title}

${post.content}

---

**SEO Title:** ${post.seo_meta.title}
**SEO Description:** ${post.seo_meta.description}
**Keywords:** ${post.seo_meta.keywords.join(', ')}

**Sources:**
${post.sources.map((s: any, i: number) => `${i + 1}. [${s.title}](${s.url})`).join('\n')}
`;

    copyToClipboard(markdown, 'Markdown content');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Blog Posts</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {posts.length} post{posts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Button onClick={() => window.location.href = '/'}>
            Create New Post
          </Button>
        </div>

        {!posts.length ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first blog post to get started.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Generate Blog Post
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const outline = JSON.parse(post.outline);
              const createdDate = new Date(post.created_at).toLocaleDateString();

              return (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={outline.title}
                        className="w-full h-32 object-cover rounded-t-lg mb-3"
                      />
                    )}
                    <CardTitle className="text-lg line-clamp-2">
                      {outline.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="outline" className="capitalize">
                        {post.tone}
                      </Badge>
                      <span>{createdDate}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {post.seo_meta.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.seo_meta.keywords.slice(0, 3).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {post.seo_meta.keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{post.seo_meta.keywords.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(outline.title, 'Title')}
                        className="flex-1"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportAsMarkdown(post)}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePost(post.id)}
                      >
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