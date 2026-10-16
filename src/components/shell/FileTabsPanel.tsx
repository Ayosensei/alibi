'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Chip, Stamp, EmptyState, TraceRow } from '@/components/atoms';
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

  const tabs: Array<{ id: typeof selectedTab; label: string; icon: React.ReactNode }> = [
    { id: 'timeline', label: 'Timeline', icon: <CalendarDays className="size-3.5" /> },
    { id: 'board', label: 'Board', icon: <LayoutGrid className="size-3.5" /> },
    { id: 'inspector', label: 'Inspector', icon: <Sparkles className="size-3.5 text-inspector" /> },
    { id: 'notes', label: 'Notes', icon: <BookOpen className="size-3.5" /> },
  ];

  return (
    <section className="flex-1 min-w-0 md:min-w-[480px] lg:min-w-[560px] flex flex-col bg-surface-1 h-full overflow-hidden select-none">
      {/* 1. Folder Tabs Bar */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => selectTab(tab.id)}
                className={`relative h-10 px-3 text-xs font-medium rounded-none border-b-2 transition-all ${
                  isActive
                    ? 'border-primary text-text-primary bg-surface-2'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
              </Button>
            );
          })}
        </div>

        {/* Quick count badges */}
        <div className="flex items-center gap-1.5 hidden sm:flex">
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

            {/* Empty or Loaded state guidance */}
            {(board?.statements.length ?? 0) === 0 ? (
              <EmptyState
                titlePrefix="Ask someone where they "
                titleItalic="were"
                titleSuffix="."
                description="The timeline populates as suspects make location assertions and evidence is gathered."
                icon={<Clock className="size-6 text-text-tertiary" />}
              />
            ) : (
              <div className="space-y-2">
                <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider block">
                  Discovered Statements ({board?.statements.length})
                </span>
                <div className="space-y-1.5">
                  {board?.statements.map((stmt) => (
                    <div
                      key={stmt.id}
                      className="p-2.5 rounded-lg bg-surface-2 border border-border/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-semibold text-text-primary capitalize block">
                          {stmt.by}: "{stmt.text}"
                        </span>
                        {stmt.room && stmt.slot && (
                          <span className="font-mono text-xs text-text-tertiary block">
                            Room: {stmt.room.replace(/_/g, ' ')} · Slot {stmt.slot}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-brass shrink-0">
                        Tick {stmt.tick}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            <div className="p-4 rounded-xl bg-surface-2 border border-border shadow-card space-y-3">
              <span className="font-mono text-xs text-brass uppercase tracking-wider block">
                Evidence Exhibits ({board?.evidence.length ?? 0})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {board?.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg bg-paper text-ink shadow-polaroid space-y-1 select-text"
                  >
                    <div className="flex items-center justify-between border-b border-ink/15 pb-1">
                      <span className="font-mono text-xs font-semibold uppercase text-ink/70">
                        {ev.id}
                      </span>
                      <Pin className="size-3 text-ink/50" />
                    </div>
                    <div className="font-semibold text-xs text-ink/90">{ev.title}</div>
                    <p className="text-xs text-ink/80 leading-normal line-clamp-3">
                      {ev.text}
                    </p>
                    <div className="font-mono text-xs text-ink/60 pt-1">
                      Room: {ev.room.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                  Autonomous reasoning queries run against the FalkorDB play graph.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={isInspectorStreaming}
                onClick={() => runInspectorAction('assist')}
                className="text-xs"
              >
                <Sparkles className="size-3 mr-1 text-inspector" />
                Run Assist
              </Button>
            </div>

            {inspectorEvents.length === 0 ? (
              <EmptyState
                titlePrefix="Ask the "
                titleItalic="Inspector"
                titleSuffix=" to reason."
                description="The inspector executes up to 8 reasoning graph queries to detect contradictions and impossible travel."
                icon={<Sparkles className="size-6 text-inspector" />}
                action={
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => runInspectorAction('assist')}
                  >
                    Start Investigation Assist
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {inspectorEvents.map((e, idx) => {
                  if (e.type === 'tool_result') {
                    return (
                      <TraceRow
                        key={idx}
                        agent="inspector"
                        tool={e.tool}
                        rows={e.rows}
                        ms={e.ms}
                      />
                    );
                  }
                  if (e.type === 'message') {
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-2 border-l-2 border-inspector text-xs text-text-primary leading-relaxed"
                      >
                        {e.text}
                      </div>
                    );
                  }
                  if (e.type === 'flag') {
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-surface-2 border border-border flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Stamp status="contradiction" label={e.kind} />
                          <span className="text-xs text-text-secondary">{e.note}</span>
                        </div>
                      </div>
                    );
                  }
                  if (e.type === 'hypothesis') {
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-surface-3 border border-inspector/50 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-mono text-inspector">
                          <span>Hypothesis ({Math.round(e.confidence * 100)}% confidence)</span>
                        </div>
                        <p className="text-xs text-text-primary">{e.text}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
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
