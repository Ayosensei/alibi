'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Chip, Stamp, EmptyState, TraceRow } from '@/components/atoms';
import { TimelineGrid } from '@/components/timeline/TimelineGrid';
import { EvidenceBoard } from '@/components/board/EvidenceBoard';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { useGameStore } from '@/lib/store';
import {
  CalendarDays,
  LayoutGrid,
  Sparkles,
  BookOpen,
  Flag,
  Lightbulb,
  Share2,
  AlertCircle,
  Clock,
  Pin,
} from 'lucide-react';

export function FileTabsPanel() {
  const {
    caseData,
    board,
    selectedTab,
    selectTab,
    contradictions,
    rehearsed,
    impossible,
    inspectorEvents,
    isInspectorStreaming,
    runInspectorAction,
  } = useGameStore();

  const tabs: Array<{ id: typeof selectedTab; label: string; num: string; icon: React.ReactNode }> = [
    { id: 'timeline', label: 'Timeline', num: '1', icon: <CalendarDays className="size-3.5" /> },
    { id: 'board', label: 'Board', num: '2', icon: <LayoutGrid className="size-3.5" /> },
    { id: 'inspector', label: 'Inspector', num: '3', icon: <Sparkles className="size-3.5 text-inspector" /> },
    { id: 'notes', label: 'Notes', num: '4', icon: <BookOpen className="size-3.5" /> },
  ];

  return (
    <section className="flex-1 min-w-0 md:min-w-[480px] lg:min-w-[560px] flex flex-col bg-surface-1 h-full overflow-hidden select-none">
      {/* 1. Folder Tabs Bar */}
      <div className="h-14 shrink-0 flex items-center justify-between px-2 sm:px-4 border-b border-border bg-surface-2/60 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 shrink-0">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => selectTab(tab.id)}
                className={`relative h-10 px-2.5 sm:px-3 text-xs font-medium rounded-none border-b-2 transition-all ${
                  isActive
                    ? 'border-primary text-text-primary bg-surface-2'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
                title={`Switch to ${tab.label} (${tab.num})`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* Quick count badges (Hidden on narrow screens) */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {contradictions.length > 0 && (
            <Chip variant="thread" className="text-xs">
              {contradictions.length} conflict{contradictions.length === 1 ? '' : 's'}
            </Chip>
          )}
          {rehearsed.length > 0 && (
            <Chip variant="brass" className="text-xs">
              {rehearsed.length} rehearsed
            </Chip>
          )}
        </div>
      </div>

      {/* 2. Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* TIMELINE TAB */}
        {selectedTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Chronological <span className="italic font-normal text-thread">Timeline</span>
                </h3>
                <p className="text-xs text-text-secondary">
                  Suspect location claims cross-referenced with physical scene evidence across 8 time slots.
                </p>
              </div>
            </div>

            {/* Quick Timeline Summary */}
            <div className="p-4 rounded-xl bg-surface-2 border border-border shadow-card space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-brass uppercase">
                <Clock className="size-3.5 text-brass" />
                <span>Active Window & Statements</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-surface-3 border border-border text-center">
                  <span className="text-xs text-text-tertiary block">Statements</span>
                  <span className="font-mono text-base font-semibold text-text-primary tabular-nums">
                    {board?.statements.length ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-3 border border-border text-center">
                  <span className="text-xs text-text-tertiary block">Contradictions</span>
                  <span className="font-mono text-base font-semibold text-thread tabular-nums">
                    {contradictions.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-3 border border-border text-center">
                  <span className="text-xs text-text-tertiary block">Rehearsed</span>
                  <span className="font-mono text-base font-semibold text-brass tabular-nums">
                    {rehearsed.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-3 border border-border text-center">
                  <span className="text-xs text-text-tertiary block">Impossible</span>
                  <span className="font-mono text-base font-semibold text-status-impossible tabular-nums">
                    {impossible.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Timeline Grid */}
            <TimelineGrid />
          </div>
        )}

        {/* BOARD TAB */}
        {selectedTab === 'board' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Evidence <span className="italic font-normal text-thread">Board</span>
                </h3>
                <p className="text-xs text-text-secondary">
                  Interactive network of cards linked by contradictions, rehearsed alibis, and physical evidence.
                </p>
              </div>
            </div>

            {/* Hero Evidence Board Canvas */}
            <EvidenceBoard />
          </div>
        )}

        {/* INSPECTOR TAB */}
        {selectedTab === 'inspector' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  AI <span className="italic font-normal text-inspector">Inspector</span> Feed
                </h3>
                <p className="text-xs text-text-secondary">
                  Autonomous graph reasoning queries with real-time SSE execution and live board highlights.
                </p>
              </div>
            </div>

            {/* Hero Inspector Panel Component */}
            <InspectorPanel />
          </div>
        )}

        {/* NOTES TAB */}
        {selectedTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary">
                  Case <span className="italic font-normal text-thread">Notes</span> & Flags
                </h3>
                <p className="text-xs text-text-secondary">
                  Deductive flags, recorded relationships, and hypotheses.
                </p>
              </div>
            </div>

            {/* Flags */}
            <div className="space-y-2">
              <span className="font-mono text-xs text-brass uppercase tracking-wider block">
                Flags ({board?.flags.length ?? 0})
              </span>
              {(board?.flags.length ?? 0) === 0 ? (
                <p className="text-xs text-text-tertiary">No flags recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {board?.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className="p-3 rounded-lg bg-surface-2 border border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Stamp
                          status={
                            flag.kind === 'rehearsed'
                              ? 'rehearsed'
                              : flag.kind === 'impossible'
                              ? 'impossible'
                              : 'contradiction'
                          }
                          label={flag.kind}
                        />
                        <Chip variant={flag.by === 'inspector' ? 'inspector' : 'default'}>
                          By {flag.by}
                        </Chip>
                      </div>
                      <p className="text-xs text-text-primary">{flag.note}</p>
                      <span className="font-mono text-xs text-text-tertiary block">
                        Refs: {flag.refs.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hypotheses */}
            <div className="space-y-2 border-t border-border pt-4">
              <span className="font-mono text-xs text-brass uppercase tracking-wider block">
                Hypotheses ({board?.hypotheses.length ?? 0})
              </span>
              {(board?.hypotheses.length ?? 0) === 0 ? (
                <p className="text-xs text-text-tertiary">No hypotheses recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {board?.hypotheses.map((hyp) => (
                    <div
                      key={hyp.id}
                      className="p-3 rounded-lg bg-surface-2 border border-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Chip variant="inspector">By {hyp.by}</Chip>
                        <span className="font-mono text-xs text-brass">
                          Confidence: {Math.round(hyp.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-text-primary">{hyp.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
