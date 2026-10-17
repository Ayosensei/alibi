'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary p-1 -ml-1 rounded transition-colors group shrink-0"
          title="Back to Dossiers Menu"
        >
          <ArrowLeft className="size-4" />
          <Image
            src="/alibi-logo.jpg"
            alt="Alibi Logo"
            width={24}
            height={24}
            className="size-6 rounded-full object-cover border border-brass/50 group-hover:border-brass transition-colors shadow-sm"
          />
          <span className="font-mono text-xs text-text-secondary group-hover:text-text-primary hidden sm:inline font-medium">
            Menu
          </span>
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

      {/* Center: Window & Tick Info (Visible on md+) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
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
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setResetModalOpen(true)}
          className="text-xs text-text-secondary hover:text-text-primary hidden sm:inline-flex h-8 px-2"
          title="Restart Case Investigation (Reset Progress)"
        >
          <RotateCcw className="size-3.5 mr-1 text-text-tertiary" />
          Restart
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBriefingOpen(true)}
          className="text-xs text-text-secondary hover:text-text-primary hidden md:inline-flex h-8 px-2.5"
          title="Case Briefing & Shortcuts (?)"
        >
          <HelpCircle className="size-3.5 mr-1" />
          Briefing
        </Button>

        {caseData.baitsAllowed > 0 && (
          <Button
            variant="brass"
            size="sm"
            disabled={baitsLeft <= 0}
            onClick={() => setBaitModalOpen(true)}
            className="text-xs h-8 px-2 sm:px-3"
            title="Use Bait Announcement (B)"
          >
            <Sparkles className="size-3.5 mr-1" />
            Bait ({baitsLeft})
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={isInspectorStreaming}
          onClick={() => runInspectorAction('assist')}
          className="text-xs h-8 px-2 sm:px-3"
        >
          <Sparkles className="size-3.5 mr-1 text-inspector" />
          <span className="hidden sm:inline">Ask </span>Inspector
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAccuseModalOpen(true)}
          className="text-xs h-8 px-2.5 sm:px-3"
          title="File Formal Accusation (A)"
        >
          <ShieldAlert className="size-3.5 mr-1" />
          Accuse
        </Button>
      </div>
    </header>
  );
}
