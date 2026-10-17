'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  Clock,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  Search,
  RotateCcw,
} from 'lucide-react';

export function CaseHeader() {
  const {
    caseData,
    board,
    setAccuseModalOpen,
    setBaitModalOpen,
    runInspectorAction,
    setBriefingOpen,
    setResetModalOpen,
    isInspectorStreaming,
  } = useGameStore();

  if (!caseData) return null;

  const baitsLeft = board?.baitsLeft ?? caseData.baitsAllowed;

  // Window calculation: from board?.window or caseData.publicWindow
  const activeWindow = board?.window ?? caseData.publicWindow;
  const windowTime = activeWindow
    ? activeWindow.map((s) => caseData.slots[s - 1] ?? `Slot ${s}`).join(' – ')
    : 'Unknown';

  const tick = board?.tick ?? 0;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-surface-1 border-b border-border shadow-card select-none">
      {/* Left: Back Link & Case Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/season/1"
          className="text-text-secondary hover:text-text-primary p-1 -ml-1 rounded transition-colors"
          title="Back to Dossiers"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-xs font-semibold tracking-widest text-brass uppercase shrink-0 hidden sm:inline">
            FILE 0{caseData.level}
          </span>
          <span className="text-border-strong hidden sm:inline">/</span>
          <h1 className="font-serif text-base md:text-lg font-semibold text-text-primary truncate">
            {caseData.title}
          </h1>
        </div>
      </div>

      {/* Center: Window & Tick Info */}
      <div className="flex items-center gap-3">
        <Chip
          variant="thread"
          icon={<Clock className="size-3 text-thread" />}
          className="text-xs font-mono"
        >
          <span className="hidden sm:inline">Window:</span> {windowTime}
        </Chip>

        <div className="font-mono text-xs text-text-secondary tabular-nums px-2 py-0.5 rounded bg-surface-2 border border-border">
          Tick <span className="text-text-primary font-medium">{tick}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetModalOpen(true)}
          className="text-xs text-text-secondary hover:text-text-primary hidden sm:inline-flex"
          title="Restart Case Investigation (Reset Progress)"
        >
          <RotateCcw className="size-3.5 mr-1 text-text-tertiary" />
          Restart
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBriefingOpen(true)}
          className="text-xs text-text-secondary hover:text-text-primary hidden md:inline-flex"
          title="Case Briefing & Shortcuts (?)"
        >
          <HelpCircle className="size-3.5 mr-1" />
          Briefing
          <kbd className="ml-1.5 px-1 py-0.5 rounded bg-surface-2 border border-border text-xs text-text-tertiary">?</kbd>
        </Button>

        {caseData.baitsAllowed > 0 && (
          <Button
            variant="brass"
            size="sm"
            disabled={baitsLeft <= 0}
            onClick={() => setBaitModalOpen(true)}
            className="text-xs"
            title="Use Bait Announcement (B)"
          >
            <Sparkles className="size-3.5 mr-1" />
            Bait ({baitsLeft})
            <kbd className="ml-1 px-1 py-0.5 rounded bg-surface-2 border border-border text-xs text-text-primary">B</kbd>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={isInspectorStreaming}
          onClick={() => runInspectorAction('assist')}
          className="text-xs"
        >
          <Sparkles className="size-3.5 mr-1 text-inspector" />
          <span className="hidden sm:inline">Ask</span> Inspector
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAccuseModalOpen(true)}
          className="text-xs"
          title="File Formal Accusation (A)"
        >
          <ShieldAlert className="size-3.5 mr-1" />
          Accuse
          <kbd className="ml-1.5 px-1 py-0.5 rounded bg-surface-2 border border-border text-xs text-text-primary">A</kbd>
        </Button>
      </div>
    </header>
  );
}
