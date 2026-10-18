'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, TraceRow, Stamp, Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  HelpCircle,
  AlertCircle,
  UserCheck,
  Compass,
  ArrowRight,
  Loader2,
  Check,
  ShieldCheck,
  History,
  Scale,
  Database,
} from 'lucide-react';

const TOOL_FRIENDLY_NAMES: Record<string, string> = {
  findContradictions: 'Contradiction Detection',
  checkFeasibility: 'Travel Alibi Validation',
  findRehearsedAlibis: 'Rehearsed Story Scan',
  findImpossibleMoves: 'Impossible Journeys Check',
  whoCouldHave: 'Candidate Elimination',
  motivePaths: 'Motive Chain Traversal',
  alibiSupport: 'Witness Reliability Check',
  getBoard: 'Case Board Sync',
};

export function InspectorPanel() {
  const {
    caseData,
    inspectorEvents,
    isInspectorStreaming,
    activeInspectorSource,
    runInspectorAction,
    setAccuseModalOpen,
    setPrefilledAccused,
  } = useGameStore();

  const [viewMode, setViewMode] = React.useState<'detective' | 'judge'>('detective');
  const [selectedSuspectId, setSelectedSuspectId] = React.useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const livingSuspects = caseData?.people.filter((p) => !p.victim) ?? [];

  // Auto-scroll to bottom of stream
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [inspectorEvents, isInspectorStreaming]);

  // Find latest hypothesis in events
  const latestHypothesis = React.useMemo(() => {
    for (let i = inspectorEvents.length - 1; i >= 0; i--) {
      const ev = inspectorEvents[i];
      if (ev.type === 'hypothesis') return ev;
    }
    return null;
  }, [inspectorEvents]);

  const handleUseAsAccusation = (suspectId?: string) => {
    if (!suspectId) return;
    setPrefilledAccused([suspectId]);
    setAccuseModalOpen(true);
  };

  const handleAskCouldHave = (suspectId: string) => {
    const suspect = livingSuspects.find((s) => s.id === suspectId);
    if (!suspect) return;
    setIsPickerOpen(false);
    runInspectorAction('assist', `Could ${suspect.name} have committed the crime?`);
  };

  return (
    <div className="flex flex-col h-[600px] lg:h-[700px] rounded-xl border border-border bg-surface-1 overflow-hidden select-none">
      {/* Header with quick question buttons */}
      <div className="p-4 border-b border-border bg-surface-2/60 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-inspector" />
            <span className="font-mono text-xs uppercase tracking-widest text-inspector">
              Inspector Deductions
            </span>
            {viewMode === 'judge' && activeInspectorSource && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-3 text-text-tertiary border border-border">
                {activeInspectorSource === 'recorded'
                  ? 'Recorded Run'
                  : activeInspectorSource === 'deterministic'
                  ? 'FalkorDB Client'
                  : 'AI Agent'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isInspectorStreaming && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-inspector animate-pulse">
                <Loader2 className="size-3 animate-spin" />
                <span className="hidden sm:inline">
                  {viewMode === 'detective' ? 'Examining evidence...' : 'Querying graph...'}
                </span>
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg bg-surface-3 p-0.5 border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('detective')}
                className={cn(
                  'h-6 px-2.5 rounded-md text-xs font-mono transition-colors',
                  viewMode === 'detective'
                    ? 'bg-surface-1 text-text-primary shadow-xs font-medium'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                Deductions
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('judge')}
                className={cn(
                  'h-6 px-2.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1',
                  viewMode === 'judge'
                    ? 'bg-surface-1 text-inspector shadow-xs font-medium'
                    : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                <Database className="size-3" />
                Technical Trace
              </Button>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isInspectorStreaming}
            onClick={() => runInspectorAction('assist', "What doesn't add up?")}
            className="text-xs h-8"
          >
            <AlertCircle className="size-3 mr-1 text-thread" />
            What doesn't add up?
          </Button>

          {/* Person Picker for 'Could {suspect} have done it?' */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              disabled={isInspectorStreaming}
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="text-xs h-8"
            >
              <UserCheck className="size-3 mr-1 text-inspector" />
              {selectedSuspectId
                ? `Could ${livingSuspects.find((s) => s.id === selectedSuspectId)?.name.split(' ')[0]} do it?`
                : 'Could [suspect] do it?'}
            </Button>

            {isPickerOpen && (
              <div className="absolute top-full left-0 mt-1 z-30 w-48 p-1.5 rounded-lg bg-surface-3 border border-border shadow-floating space-y-1 animate-in fade-in duration-150">
                <span className="font-mono text-xs text-text-tertiary px-2 py-1 block">
                  Select Suspect
                </span>
                {livingSuspects.map((s) => (
                  <Button
                    key={s.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSuspectId(s.id);
                      handleAskCouldHave(s.id);
                    }}
                    className="w-full justify-start text-xs h-7 text-text-primary hover:text-inspector"
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            disabled={isInspectorStreaming}
            onClick={() => runInspectorAction('assist', 'Suggest the next question')}
            className="text-xs h-8"
          >
            <Compass className="size-3 mr-1 text-brass" />
            Suggest next question
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isInspectorStreaming}
            onClick={() => runInspectorAction('cold_case')}
            className="text-xs h-8 text-text-tertiary hover:text-text-primary ml-auto"
          >
            <History className="size-3 mr-1" />
            Cold case run
          </Button>
        </div>
      </div>

      {/* Events Stream Feed */}
      <div
        ref={scrollRef}
        role="region"
        aria-live="polite"
        aria-label="AI Inspector Reasoning Stream"
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 select-text"
      >
        {inspectorEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              titlePrefix="Ask the "
              titleItalic="Inspector"
              titleSuffix=" to reason."
              description="The AI Inspector queries the play graph to identify impossible moves, alibi contradictions, and motive connections."
              icon={<Sparkles className="size-6 text-inspector" />}
              action={
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => runInspectorAction('assist', "What doesn't add up?")}
                >
                  Ask: What doesn't add up?
                </Button>
              }
            />
          </div>
        ) : (
          inspectorEvents.map((e, idx) => {
            // 1. Tool Call
            if (e.type === 'tool_call') {
              if (viewMode === 'detective') {
                // If it's the latest event and inspector is streaming, show an active scanning indicator
                if (isInspectorStreaming && idx === inspectorEvents.length - 1) {
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-surface-2 border border-border flex items-center gap-2 text-xs font-mono text-inspector animate-pulse"
                    >
                      <Loader2 className="size-3 animate-spin" />
                      <span>Examining case evidence...</span>
                    </div>
                  );
                }
                return null;
              }

              // In Judge mode, show the full technical tool call
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-surface-2 border border-border/80 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2 rounded-full bg-inspector shrink-0" />
                    <span className="text-text-primary font-semibold shrink-0">{e.tool}</span>
                    <span className="text-text-tertiary truncate">
                      {JSON.stringify(e.args)}
                    </span>
                  </div>
                  <span className="text-text-tertiary text-xs shrink-0 pl-2">calling...</span>
                </div>
              );
            }

            // 2. Tool Result Trace Row
            if (e.type === 'tool_result') {
              const friendlyName = TOOL_FRIENDLY_NAMES[e.tool] ?? e.tool;

              if (viewMode === 'detective') {
                if (!e.summary) return null;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-2 text-xs animate-in fade-in"
                  >
                    <div className="flex items-center gap-2 text-text-primary font-medium">
                      <Compass className="size-3.5 text-brass shrink-0" />
                      <span className="font-semibold">{friendlyName}</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed pl-5 font-normal">
                      {e.summary}
                    </p>
                  </div>
                );
              }

              // In Judge mode, display full graph read details
              return (
                <div key={idx} className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-inspector">
                      <Database className="size-3" />
                      <span className="font-semibold">{friendlyName} ({e.tool})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-3 text-text-secondary border border-border">
                      roQuery · {e.ms.toFixed(1)}ms
                    </span>
                  </div>
                  <TraceRow
                    agent="inspector"
                    tool={e.tool}
                    rows={e.rows}
                    ms={e.ms}
                  />
                  {e.summary && (
                    <p className="text-text-secondary pl-2 border-l border-inspector/50">
                      ↳ {e.summary}
                    </p>
                  )}
                  {e.highlight && e.highlight.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-text-tertiary">Affected Entities:</span>
                      {e.highlight.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          className="px-2 py-0.5 rounded bg-surface-3 text-brass border border-border"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // 3. Plain Language Narrative Message
            if (e.type === 'message') {
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-surface-2 border-l-2 border-inspector text-xs text-text-primary leading-relaxed shadow-sm animate-in fade-in"
                >
                  <div className="flex items-center gap-1.5 font-mono text-xs text-inspector font-semibold mb-1">
                    <Sparkles className="size-3" />
                    Inspector Deduction
                  </div>
                  <p className="leading-relaxed">{e.text}</p>
                </div>
              );
            }

            // 4. Board Flag Written
            if (e.type === 'flag') {
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-surface-2 border border-thread/40 flex items-center justify-between gap-3 animate-in fade-in"
                >
                  <div className="flex items-center gap-2">
                    <Stamp status="contradiction" label={e.kind.toUpperCase()} />
                    <span className="text-xs text-text-secondary">{e.note}</span>
                  </div>
                  <span className="font-mono text-xs text-thread uppercase tracking-wider shrink-0">
                    Flag Pinned to Board
                  </span>
                </div>
              );
            }

            // 5. Board Hypothesis Written
            if (e.type === 'hypothesis') {
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-2 border border-inspector/60 space-y-2.5 shadow-card animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-inspector font-semibold">
                      <Sparkles className="size-3.5" />
                      <span>Formal Accusation Hypothesis</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-3 text-text-primary border border-border">
                      {Math.round(e.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-text-primary leading-relaxed">
                    {e.text}
                  </p>

                  {e.person && (
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="font-mono text-xs text-text-tertiary">
                        Target Suspect: <strong className="capitalize text-text-primary">{e.person}</strong>
                      </span>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUseAsAccusation(e.person)}
                        className="h-7 text-xs font-mono gap-1"
                      >
                        <Scale className="size-3" />
                        Use as my accusation
                      </Button>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })
        )}
      </div>

      {/* Footer Banner if cold case or hypothesis formed */}
      {activeInspectorSource === 'recorded' && (
        <div className="p-2.5 border-t border-border bg-surface-2 text-center text-xs font-mono text-text-secondary">
          Recorded run, re-executed live against the graph.
        </div>
      )}
    </div>
  );
}
