-- Create generated_posts table for Phase 2
CREATE TABLE generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  tone TEXT NOT NULL,
  audience TEXT NOT NULL,
  outline TEXT,
  content TEXT,
  seo_meta JSONB,
  image_url TEXT,
  sources JSONB[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own posts
CREATE POLICY "Users can insert their own posts" ON generated_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to read their own posts
CREATE POLICY "Users can read their own posts" ON generated_posts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON generated_posts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON generated_posts
  FOR DELETE USING (auth.uid() IS NOT NULL);