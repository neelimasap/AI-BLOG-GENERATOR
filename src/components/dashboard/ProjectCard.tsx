import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';

const statusColors: Record<string, string> = {
  draft: 'secondary',
  researching: 'outline',
  outlining: 'outline',
  writing: 'outline',
  complete: 'default',
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{project.title}</CardTitle>
          <Badge variant={statusColors[project.status] as 'default' | 'secondary' | 'outline'}>
            {project.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{project.topic}</CardDescription>
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(project.created_at).toLocaleDateString()}
        </span>
        <Link href={`/projects/${project.id}`}><Button size="sm">Open</Button></Link>
      </CardFooter>
    </Card>
  );
}
