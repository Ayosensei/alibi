'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorBannerProps {
  message: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  message,
  hint,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-2 border border-danger/40 text-text-primary shadow-card animate-in fade-in duration-200',
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="size-4 text-danger shrink-0 mt-0.5" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-text-primary">
            {message}
          </span>
          {hint && (
            <span className="text-xs text-text-secondary mt-0.5">
              {hint}
            </span>
          )}
        </div>
      </div>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="shrink-0 text-xs"
        >
          <RotateCcw className="size-3.5 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
