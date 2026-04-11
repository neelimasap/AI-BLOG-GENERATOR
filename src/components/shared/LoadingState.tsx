import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner';
  label?: string;
  rows?: number;
}

export function LoadingState({ variant = 'skeleton', label, rows = 3 }: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {label && <span className="text-sm">{label}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
