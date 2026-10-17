'use client';

import * as React from 'react';
import Image from 'next/image';
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
            'relative size-10 rounded-full shrink-0 overflow-hidden ring-1 select-none shadow-sm',
            isVictim
              ? 'ring-thread/60'
              : isSelected
              ? 'ring-brass'
              : 'ring-border group-hover:ring-brass/50'
          )}
        >
          <Image
            src={`/avatars/${id}.svg`}
            alt={name}
            width={40}
            height={40}
            className="size-full object-cover"
          />
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
      {!isVictim && statementsCount > 0 && (
        <div className="flex items-center gap-1 text-xs font-mono text-text-tertiary pt-0.5">
          <MessageSquareText className="size-3 text-brass/70" />
          <span className="tabular-nums">{statementsCount}</span> {statementsCount === 1 ? 'claim logged' : 'claims logged'}
        </div>
      )}
    </div>
  );
}
