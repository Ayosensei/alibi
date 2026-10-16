'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Stamp, type StampProps } from './Stamp';
import { FileText, Pin, MessageSquare } from 'lucide-react';

export interface PolaroidProps {
  id: string;
  kind?: 'evidence' | 'statement' | 'hypothesis';
  label: string; // e.g. "EXHIBIT A" or "STATEMENT"
  title?: string;
  text: string;
  source?: string; // e.g. "By Dee (tick 5)" or "Found in prop store"
  isFlagged?: boolean;
  stamp?: {
    label: string;
    status: StampProps['status'];
  };
  className?: string;
  onClick?: () => void;
}

function getDeterministicRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = ((Math.abs(hash) % 300) / 100) - 1.5;
  return Number(normalized.toFixed(2));
}

export function Polaroid({
  id,
  kind = 'evidence',
  label,
  title,
  text,
  source,
  isFlagged = false,
  stamp,
  className,
  onClick,
}: PolaroidProps) {
  const rotation = React.useMemo(() => getDeterministicRotation(id), [id]);

  const IconComponent =
    kind === 'evidence' ? Pin : kind === 'statement' ? MessageSquare : FileText;

  return (
    <div
      data-polaroid-id={id}
      onClick={onClick}
      style={{ transform: `rotate(${rotation}deg)` }} // design-ok: deterministic rotation
      className={cn(
        'relative flex flex-col justify-between w-64 bg-paper text-ink p-3.5 rounded-sm shadow-polaroid transition-all duration-200 select-none cursor-pointer',
        isFlagged && 'shadow-thread-glow ring-1 ring-thread',
        className
      )}
    >
      {/* Stamp watermark if provided */}
      {stamp && (
        <div className="absolute -top-2.5 -right-2.5 z-20 pointer-events-none">
          <Stamp label={stamp.label} status={stamp.status} />
        </div>
      )}

      {/* Top Bar: Typewriter label and Icon band */}
      <div className="flex items-center justify-between border-b border-ink/15 pb-2 mb-2.5">
        <span className="font-mono text-xs font-semibold tracking-widest text-ink/75 uppercase">
          {label}
        </span>
        <div className="size-5 rounded-sm bg-surface-3/15 flex items-center justify-center text-ink/70">
          <IconComponent className="size-3" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-16">
        {title && (
          <h4 className="font-medium text-xs text-ink/90 line-clamp-1">
            {title}
          </h4>
        )}
        <p className="font-sans text-xs text-ink leading-relaxed line-clamp-4">
          {text}
        </p>
      </div>

      {/* Source footer */}
      {source && (
        <div className="border-t border-ink/15 pt-2 mt-2">
          <span className="font-mono text-xs text-ink/60 truncate block">
            {source}
          </span>
        </div>
      )}
    </div>
  );
}
