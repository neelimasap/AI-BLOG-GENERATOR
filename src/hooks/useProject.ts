'use client';

import { useState, useEffect } from 'react';
import type { Project } from '@/lib/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  async function createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'research_summary' | 'outline' | 'status'>) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    const project: Project = await res.json();
    setProjects((prev) => [project, ...prev]);
    return project;
  }

  return { projects, loading, createProject };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then(setProject)
      .finally(() => setLoading(false));
  }, [id]);

  async function updateProject(data: Partial<Project>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    const updated: Project = await res.json();
    setProject(updated);
    return updated;
  }

  return { project, loading, updateProject };
}
