import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  titlePrefix?: string;
  titleItalic: string;
  titleSuffix?: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  titlePrefix = '',
  titleItalic,
  titleSuffix = '',
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl bg-surface-1 border border-border/60 shadow-card min-h-64 gap-4 animate-in fade-in duration-320',
        className
      )}
    >
      {icon && (
        <div className="size-12 rounded-full bg-surface-2 flex items-center justify-center text-text-tertiary border border-border shadow-inner">
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="font-serif text-xl font-semibold text-text-primary text-balance">
          {titlePrefix}
          <span className="italic font-normal text-thread">{titleItalic}</span>
          {titleSuffix}
        </h3>
        <p className="font-sans text-xs text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
