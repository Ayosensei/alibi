import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TraceRowProps {
  agent: 'inspector' | 'engine' | 'suspect' | 'verdict';
  tool?: string;
  queryId?: string;
  rows?: number;
  ms: number;
  className?: string;
}

export function TraceRow({
  agent,
  tool,
  queryId,
  rows,
  ms,
  className,
}: TraceRowProps) {
  const isInspector = agent === 'inspector';

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-md bg-surface-2 border border-border/40 font-mono text-xs text-text-secondary select-none',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'size-1.5 rounded-full shrink-0',
            isInspector ? 'bg-inspector shadow-sm' : 'bg-text-secondary'
          )}
        />
        <span className="font-semibold text-text-primary truncate">
          {tool || queryId || 'query'}
        </span>
        {queryId && tool && (
          <span className="text-text-tertiary truncate hidden sm:inline">
            ({queryId})
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 tabular-nums text-text-tertiary text-xs">
        {rows !== undefined && (
          <span>
            {rows} {rows === 1 ? 'row' : 'rows'}
          </span>
        )}
        <span className="font-medium text-text-secondary">{ms.toFixed(1)}ms</span>
      </div>
    </div>
  );
}
