'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Chip } from './Chip';
import { MessageSquareText, Eye } from 'lucide-react';

export interface SuspectCardProps {
  id: string;
  name: string;
  role: string;
  statementsCount?: number;
  observationsCount?: number;
  isSelected?: boolean;
  isVictim?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SuspectCard({
  id,
  name,
  role,
  statementsCount = 0,
  observationsCount = 0,
  isSelected = false,
  isVictim = false,
  onClick,
  className,
}: SuspectCardProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-suspect-id={id}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group flex flex-col gap-2.5 p-3 rounded-xl bg-surface-2 shadow-card border transition-all duration-120 outline-none cursor-pointer',
        isSelected
          ? 'border-brass ring-2 ring-brass/80 bg-surface-3'
          : 'border-border hover:bg-surface-3 hover:border-border-strong focus-visible:ring-2 focus-visible:ring-thread',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with inset outline */}
        <div
          className={cn(
            'size-10 rounded-full flex items-center justify-center shrink-0 font-medium text-xs select-none ring-1 ring-inset',
            isVictim
              ? 'bg-primary/20 text-thread ring-thread/40'
              : 'bg-surface-3 text-text-primary ring-border-strong group-hover:ring-brass/40'
          )}
        >
          {initials}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-text-primary truncate">
              {name}
            </span>
            {isVictim && (
              <span className="font-mono text-xs text-thread uppercase tracking-wider">
                (Victim)
              </span>
            )}
          </div>
          <span className="text-xs text-text-secondary truncate">{role}</span>
        </div>
      </div>

      {/* Badges / Chips */}
      {!isVictim && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <Chip
            variant="default"
            icon={<MessageSquareText className="size-3 text-text-tertiary" />}
          >
            <span className="tabular-nums">{statementsCount}</span> {statementsCount === 1 ? 'statement' : 'statements'}
          </Chip>
          {observationsCount > 0 && (
            <Chip
              variant="brass"
              icon={<Eye className="size-3 text-brass" />}
            >
              <span className="tabular-nums">{observationsCount}</span> {observationsCount === 1 ? 'observation' : 'observations'}
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}
