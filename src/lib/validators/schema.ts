import { z } from 'zod';

export const ResearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  num_results: z.number().int().min(1).max(20).optional(),
});

export const ScrapeRequestSchema = z.object({
  url: z.string().url(),
});

export const OutlineRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  audience: z.string().min(1).max(200),
  tone: z.enum(['professional', 'conversational', 'technical', 'casual']),
  research_summary: z.string().max(10000),
});

export const DraftRequestSchema = z.object({
  outline: z.object({
    title: z.string(),
    meta_description: z.string(),
    sections: z.array(z.any()),
    total_estimated_words: z.number(),
  }),
  research_context: z.string().max(20000),
  tone: z.enum(['professional', 'conversational', 'technical', 'casual']),
  word_count: z.number().int().min(300).max(10000),
  project_id: z.string().uuid(),
});

export const ImageRequestSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(['photorealistic', 'illustration', 'diagram', 'infographic']),
  project_id: z.string().uuid(),
});

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(300),
  topic: z.string().min(1).max(500),
  audience: z.string().min(1).max(200).default('general readers'),
  tone: z.enum(['professional', 'conversational', 'technical', 'casual']).default('professional'),
  target_word_count: z.number().int().min(300).max(10000).default(1500),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  status: z.enum(['draft', 'researching', 'outlining', 'writing', 'complete']).optional(),
  research_summary: z.string().nullable().optional(),
  outline: z.string().nullable().optional(),
});

export const CreateDraftSchema = z.object({
  content: z.string(),
  word_count: z.number().int().min(0).default(0),
  version: z.number().int().min(1).default(1),
});

export const UpdateDraftSchema = z.object({
  content: z.string().optional(),
  word_count: z.number().int().min(0).optional(),
  is_final: z.boolean().optional(),
});

// Phase 3 API schemas
export const GenerateRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  audience: z.string().min(1).max(200),
  tone: z.enum(['professional', 'conversational', 'technical', 'casual']),
  research_sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    snippet: z.string(),
    content: z.string().optional(),
  })),
});

export const SaveRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  tone: z.enum(['professional', 'conversational', 'technical', 'casual']),
  audience: z.string().min(1).max(200),
  outline: z.string(),
  content: z.string(),
  seo_meta: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  image_url: z.string().url().optional().or(z.literal('')),
  sources: z.array(z.any()),
});

// Phase 5 SEO schema
export const SEOCheckRequestSchema = z.object({
  content: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
});
