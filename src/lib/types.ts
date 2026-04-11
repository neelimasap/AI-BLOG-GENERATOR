// ---- Supabase-backed entities ----

export type ProjectStatus = 'draft' | 'researching' | 'outlining' | 'writing' | 'complete';
export type Tone = 'professional' | 'conversational' | 'technical' | 'casual';
export type ImageStyle = 'photorealistic' | 'illustration' | 'diagram' | 'infographic';

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  topic: string;
  audience: string;
  tone: Tone;
  target_word_count: number;
  status: ProjectStatus;
  research_summary: string | null;
  outline: string | null;
  user_id: string | null;
}

export interface Draft {
  id: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  version: number;
  content: string;
  word_count: number;
  is_final: boolean;
}

export interface GeneratedImage {
  id: string;
  project_id: string;
  created_at: string;
  fal_request_id: string;
  prompt: string;
  style: ImageStyle;
  url: string;
  width: number;
  height: number;
  is_embedded: boolean;
}

// ---- Research layer ----

export interface ResearchResult {
  id: string;
  source: 'exa' | 'serp';
  title: string;
  url: string;
  snippet: string;
  published_date: string | null;
  full_content: string | null;
  is_selected: boolean;
  scraped_at: string | null;
}

// ---- Outline layer ----

export interface OutlineSection {
  id: string;
  heading: string;
  level: 1 | 2 | 3;
  key_points: string[];
  estimated_words: number;
  subsections: OutlineSection[];
}

export interface Outline {
  title: string;
  meta_description: string;
  sections: OutlineSection[];
  total_estimated_words: number;
}

// ---- API request/response shapes ----

export interface ResearchRequest {
  query: string;
  num_results?: number;
}

export interface ScrapeRequest {
  url: string;
}

export interface OutlineRequest {
  topic: string;
  audience: string;
  tone: Tone;
  research_summary: string;
}

export interface DraftRequest {
  outline: Outline;
  research_context: string;
  tone: Tone;
  word_count: number;
  project_id: string;
}

export interface ImageRequest {
  prompt: string;
  style: ImageStyle;
  project_id: string;
}

// ---- Workflow store shape ----

export type WorkflowStep = 'research' | 'outline' | 'draft' | 'images' | 'complete';

export interface WorkflowState {
  projectId: string | null;
  step: WorkflowStep;
  topic: string;
  audience: string;
  tone: Tone;
  wordCount: number;
  researchResults: ResearchResult[];
  outlineText: string;
  outline: Outline | null;
  draftText: string;
  images: GeneratedImage[];
  isStreaming: boolean;
  error: string | null;
  // actions
  setProjectId: (id: string) => void;
  setStep: (step: WorkflowStep) => void;
  setTopic: (topic: string) => void;
  setAudience: (audience: string) => void;
  setTone: (tone: Tone) => void;
  setWordCount: (count: number) => void;
  addResearchResult: (result: ResearchResult) => void;
  toggleResearchSelected: (id: string) => void;
  setFullContent: (id: string, content: string) => void;
  appendOutlineText: (token: string) => void;
  setOutline: (outline: Outline) => void;
  appendDraftText: (token: string) => void;
  setDraftText: (text: string) => void;
  addImage: (image: GeneratedImage) => void;
  setStreaming: (val: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}
