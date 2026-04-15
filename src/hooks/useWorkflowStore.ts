'use client';

import { create } from 'zustand';
import type { WorkflowState, ResearchResult, GeneratedImage, WorkflowStep, Tone } from '@/lib/types';

const initialState = {
  projectId: null,
  step: 'research' as WorkflowStep,
  topic: '',
  audience: '',
  tone: 'professional' as Tone,
  wordCount: 1500,
  researchResults: [] as ResearchResult[],
  outlineText: '',
  outline: null,
  draftText: '',
  images: [] as GeneratedImage[],
  isStreaming: false,
  error: null,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,

  setProjectId: (id) => set({ projectId: id }),
  setStep: (step) => set({ step }),
  setTopic: (topic) => set({ topic }),
  setAudience: (audience) => set({ audience }),
  setTone: (tone) => set({ tone }),
  setWordCount: (count) => set({ wordCount: count }),

  addResearchResult: (result) =>
    set((state) => ({ researchResults: [...state.researchResults, result] })),

  toggleResearchSelected: (id) =>
    set((state) => ({
      researchResults: state.researchResults.map((r) =>
        r.id === id ? { ...r, is_selected: !r.is_selected } : r,
      ),
    })),

  setFullContent: (id, content) =>
    set((state) => ({
      researchResults: state.researchResults.map((r) =>
        r.id === id
          ? { ...r, full_content: content, scraped_at: new Date().toISOString() }
          : r,
      ),
    })),

  appendOutlineText: (token) =>
    set((state) => ({ outlineText: state.outlineText + token })),

  setOutline: (outline) => set({ outline }),

  appendDraftText: (token) =>
    set((state) => ({ draftText: state.draftText + token })),

  setDraftText: (text) => set({ draftText: text }),

  addImage: (image) =>
    set((state) => ({ images: [...state.images, image] })),

  setStreaming: (val) => set({ isStreaming: val }),
  setError: (msg) => set({ error: msg }),

  reset: () => set(initialState),
}));
