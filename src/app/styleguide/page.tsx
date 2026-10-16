'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Chip,
  Stamp,
  SuspectCard,
  Polaroid,
  ErrorBanner,
  EmptyState,
  TraceRow,
} from '@/components/atoms';
import { colors } from '@/lib/tokens';
import {
  Search,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Feather,
  Pin,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { TimelineGrid } from '@/components/timeline/TimelineGrid';
import { EvidenceBoard } from '@/components/board/EvidenceBoard';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { useGameStore } from '@/lib/store';

const COLOR_CLASSES: Record<keyof typeof colors, { bg: string; text: string; border?: string }> = {
  background: { bg: 'bg-background', text: 'text-text-primary', border: 'border-border' },
  'surface-1': { bg: 'bg-surface-1', text: 'text-text-primary', border: 'border-border' },
  'surface-2': { bg: 'bg-surface-2', text: 'text-text-primary', border: 'border-border' },
  'surface-3': { bg: 'bg-surface-3', text: 'text-text-primary', border: 'border-border' },
  border: { bg: 'bg-border', text: 'text-text-primary' },
  'border-strong': { bg: 'bg-border-strong', text: 'text-text-primary' },
  'text-primary': { bg: 'bg-text-primary', text: 'text-background' },
  'text-secondary': { bg: 'bg-text-secondary', text: 'text-background' },
  'text-tertiary': { bg: 'bg-text-tertiary', text: 'text-background' },
  primary: { bg: 'bg-primary', text: 'text-on-primary' },
  'primary-hover': { bg: 'bg-primary-hover', text: 'text-on-primary' },
  'primary-pressed': { bg: 'bg-primary-pressed', text: 'text-on-primary' },
  'on-primary': { bg: 'bg-on-primary', text: 'text-ink' },
  thread: { bg: 'bg-thread', text: 'text-background' },
  brass: { bg: 'bg-brass', text: 'text-on-brass' },
  'on-brass': { bg: 'bg-on-brass', text: 'text-brass' },
  paper: { bg: 'bg-paper', text: 'text-ink' },
  ink: { bg: 'bg-ink', text: 'text-paper' },
  inspector: { bg: 'bg-inspector', text: 'text-background' },
  danger: { bg: 'bg-danger', text: 'text-on-primary' },
  success: { bg: 'bg-success', text: 'text-background' },
  'status-contradiction': { bg: 'bg-status-contradiction', text: 'text-background' },
  'status-rehearsed': { bg: 'bg-status-rehearsed', text: 'text-background' },
  'status-impossible': { bg: 'bg-status-impossible', text: 'text-background' },
  'status-cleared': { bg: 'bg-status-cleared', text: 'text-background' },
  'status-inferred': { bg: 'bg-status-inferred', text: 'text-background' },
};

export default function StyleguidePage() {
  const { caseData, initCase } = useGameStore();

  React.useEffect(() => {
    if (!caseData) {
      initCase('l1-quiet-pact');
    }
  }, [caseData, initCase]);

  return (
    <div className="min-h-screen bg-background text-text-primary p-8 md:p-12 lg:p-16 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <header className="border-b border-border pb-8 space-y-3">
        <div className="font-mono text-xs uppercase tracking-widest text-brass">
          Design System & Component Library
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-balance">
          Alibi <span className="italic font-normal text-thread">Styleguide</span>
        </h1>
        <p className="text-text-secondary text-sm md:text-base max-w-2xl leading-relaxed">
          Case-file noir design tokens, typography, and atomic primitives. Built for precision
          graph detective gameplay where every lie leaves a path.
        </p>
      </header>

      {/* 1. Palette Tokens */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Tokens</div>
          <h2 className="font-serif text-2xl font-semibold">Color Palette</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(Object.keys(COLOR_CLASSES) as Array<keyof typeof COLOR_CLASSES>).map((name) => {
            const config = COLOR_CLASSES[name];
            return (
              <div
                key={name}
                className="flex flex-col rounded-lg bg-surface-2 p-2.5 border border-border/80 shadow-card gap-2"
              >
                <div
                  className={`h-12 w-full rounded-md ${config.bg} ${config.text} ${config.border || ''} flex items-center justify-center text-xs font-mono font-medium shadow-inner`}
                >
                  {name}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs text-text-primary font-medium truncate">
                    {name}
                  </span>
                  <span className="font-mono text-xs text-text-tertiary truncate">
                    {colors[name]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Type Scale</div>
          <h2 className="font-serif text-2xl font-semibold">Typography Hierarchy</h2>
        </div>
        <div className="rounded-xl bg-surface-1 border border-border p-6 shadow-card space-y-6">
          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="font-mono text-xs text-text-tertiary">display-xl (Playfair 56px)</span>
            <div className="font-serif text-5xl md:text-6xl font-semibold text-text-primary">
              The Thread <span className="italic font-normal text-thread">Led</span> to Clara
            </div>
          </div>

          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="font-mono text-xs text-text-tertiary">display-lg (Playfair 40px)</span>
            <div className="font-serif text-4xl font-semibold text-text-primary">
              Case File 03: <span className="italic font-normal text-brass">The Blackout Dinner</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="font-mono text-xs text-text-tertiary">display-md (Playfair 28px)</span>
            <div className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">
              Who could have performed <span className="italic font-normal text-thread">the act</span>?
            </div>
          </div>

          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="font-mono text-xs text-text-tertiary">headline (Inter 18px / 600)</span>
            <div className="text-lg font-semibold text-text-primary">
              Suspect Interrogation & Cross-Examination
            </div>
          </div>

          <div className="space-y-2 border-b border-border/60 pb-6">
            <span className="font-mono text-xs text-text-tertiary">body-lg (Inter 16px) & body-md (Inter 14px)</span>
            <p className="text-base text-text-secondary leading-relaxed">
              Every suspect statement corresponds to an authored claim in the knowledge graph.
              When claims conflict with hard physical evidence or the mansion topology, reasoning queries identify contradictions.
            </p>
            <p className="text-sm text-text-secondary leading-normal">
              Secondary body text explaining subtle alibi overlaps and physical room access constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <span className="font-mono text-xs text-text-tertiary">typewriter (IBM Plex Mono uppercase)</span>
              <div className="font-mono text-xs font-semibold tracking-widest text-brass uppercase">
                EXHIBIT C · CRIME SCENE DOOR LOG · TICK 14
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="font-mono text-xs text-text-tertiary">mono-md (IBM Plex Mono 13px)</span>
              <div className="font-mono text-xs text-text-secondary">
                MATCH (a:Person)-[:IN_ROOM]-&gt;(r:Room) WHERE a.id = $person RETURN r
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Buttons */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Controls</div>
          <h2 className="font-serif text-2xl font-semibold">Buttons & Variants</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <Button variant="default">Accuse Suspect</Button>
          <Button variant="secondary">Ask Inspector</Button>
          <Button variant="brass">Confirm Bait</Button>
          <Button variant="outline">Case Briefing</Button>
          <Button variant="ghost">Clear Filters</Button>
          <Button variant="default" disabled>Accusation Disabled</Button>
          <Button variant="secondary" size="sm">Small Action</Button>
          <Button variant="default" size="lg">Large Investigation</Button>
        </div>
      </section>

      {/* 4. Chips */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Atoms</div>
          <h2 className="font-serif text-2xl font-semibold">Chips & Metadata Pills</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <Chip variant="default">3 statements</Chip>
          <Chip variant="brass">2 tells noticed</Chip>
          <Chip variant="thread">Contradiction detected</Chip>
          <Chip variant="impossible">Impossible move</Chip>
          <Chip variant="cleared">Cleared by evidence</Chip>
          <Chip variant="inspector">AI Inspector Flag</Chip>
          <Chip variant="default" icon={<Search className="size-3 text-text-tertiary" />}>
            Searched room
          </Chip>
          <Chip variant="brass" icon={<Sparkles className="size-3 text-brass" />}>
            Bait active
          </Chip>
        </div>
      </section>

      {/* 5. Stamps */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Atoms</div>
          <h2 className="font-serif text-2xl font-semibold">Investigation Stamps</h2>
        </div>
        <div className="flex flex-wrap items-center gap-6 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <Stamp status="contradiction" label="CONTRADICTION" />
          <Stamp status="rehearsed" label="REHEARSED" />
          <Stamp status="impossible" label="IMPOSSIBLE" />
          <Stamp status="cleared" label="CLEARED" />
          <Stamp status="inferred" label="INFERRED" />
          <Stamp status="slip" label="SLIP" />
          <Stamp status="custom" label="UNVERIFIED" />
        </div>
      </section>

      {/* 6. Suspect Cards */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Atoms</div>
          <h2 className="font-serif text-2xl font-semibold">Suspect Cards</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <SuspectCard
            id="clara"
            name="Clara Vale"
            role="Daughter, finance director"
            statementsCount={4}
            observationsCount={2}
            isSelected={true}
          />
          <SuspectCard
            id="tobias"
            name="Tobias Finch"
            role="Family Bookkeeper"
            statementsCount={3}
            observationsCount={1}
            isSelected={false}
          />
          <SuspectCard
            id="roz"
            name="Roz Vale"
            role="Second wife"
            statementsCount={2}
            observationsCount={0}
            isSelected={false}
          />
          <SuspectCard
            id="edmund"
            name="Edmund Vale"
            role="Shipping Magnate"
            isVictim={true}
          />
        </div>
      </section>

      {/* 7. Polaroids */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Atoms</div>
          <h2 className="font-serif text-2xl font-semibold">Polaroid Cards (Evidence & Statements)</h2>
        </div>
        <div className="flex flex-wrap gap-8 p-8 rounded-xl bg-surface-1 border border-border shadow-card items-start">
          <Polaroid
            id="pol_ev_1"
            kind="evidence"
            label="EXHIBIT A"
            title="Broken Pocket Watch"
            text="Found stopped at 9:18 on the library parquet, crystal shattered from impact."
            source="Found in Library (Tick 4)"
          />

          <Polaroid
            id="pol_st_1"
            kind="statement"
            label="STATEMENT"
            title="Whereabouts at 9:15"
            text="I was in the drawing room pouring wine for everyone when the blackout began."
            source="By Clara Vale (Slot 4)"
          />

          <Polaroid
            id="pol_ev_flagged"
            kind="evidence"
            label="EXHIBIT B"
            title="Electronic Door Log"
            text="Magnetic lock record confirms the conservatory door remained locked throughout slots 4 to 6."
            source="Security Panel · Kitchen"
            isFlagged={true}
            stamp={{ label: 'CONTRADICTION', status: 'contradiction' }}
          />
        </div>
      </section>

      {/* 8. Error Banner & Empty State */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Feedback & States</div>
          <h2 className="font-serif text-2xl font-semibold">Error Banners & Empty States</h2>
        </div>
        <div className="space-y-6 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <ErrorBanner
            message="Connection to FalkorDB timed out during graph query execution."
            hint="Ensure the Docker container is running on port 6379."
            onRetry={() => {}}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              titlePrefix="The case file is "
              titleItalic="empty"
              titleSuffix="."
              description="Begin by questioning suspects about their whereabouts, or inspect rooms for physical evidence."
              icon={<Search className="size-6 text-text-tertiary" />}
              action={<Button variant="default" size="sm">Search Dining Hall</Button>}
            />

            <EmptyState
              titlePrefix="No "
              titleItalic="contradictions"
              titleSuffix=" detected yet."
              description="When two statements place someone in two rooms at once, or clash with physical logs, a red thread will bind them."
              icon={<Feather className="size-6 text-thread" />}
              action={<Button variant="secondary" size="sm">Review Timeline</Button>}
            />
          </div>
        </div>
      </section>

      {/* 9. Trace Rows */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Engine Inspector</div>
          <h2 className="font-serif text-2xl font-semibold">Cypher Trace Rows</h2>
        </div>
        <div className="space-y-2 p-6 rounded-xl bg-surface-1 border border-border shadow-card max-w-2xl">
          <TraceRow
            agent="engine"
            tool="findContradictions"
            queryId="Q60_contradictions"
            rows={9}
            ms={4.2}
          />
          <TraceRow
            agent="inspector"
            tool="whoCouldHave"
            queryId="Q64_who_could_have"
            rows={1}
            ms={12.8}
          />
          <TraceRow
            agent="suspect"
            tool="ask"
            queryId="Q40_claims_by_topic"
            rows={3}
            ms={2.1}
          />
        </div>
      </section>

      {/* 10. Timeline Grid & Hero Screen Primitives */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Hero Screen</div>
          <h2 className="font-serif text-2xl font-semibold">Chronological Timeline Grid</h2>
          <p className="text-text-secondary text-sm max-w-2xl">
            Cross-references statements and hard exhibits over 8 slots. Flags contradictory rooms with a
            thread ring, highlights rehearsed alibis with brass brackets, and displays cleared suspect badges.
          </p>
        </div>

        {/* Specimen Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border">
            <span className="font-mono text-xs text-text-tertiary uppercase block">Soft Statement</span>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-paper text-ink border border-ink/20 shadow-xs font-mono text-xs">
              <Feather className="size-3 text-ink/70" />
              <span>Green room</span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border">
            <span className="font-mono text-xs text-text-tertiary uppercase block">Hard Evidence</span>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-3 text-text-primary border border-border shadow-xs font-mono text-xs">
              <Pin className="size-3 text-brass" />
              <span>Prop store (E1)</span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border">
            <span className="font-mono text-xs text-text-tertiary uppercase block">Inferred Single Survivor</span>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-inspector/15 text-inspector border border-dashed border-inspector/60 font-mono text-xs">
              <Sparkles className="size-3 text-inspector" />
              <span>Study (Inferred)</span>
            </div>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border">
            <span className="font-mono text-xs text-text-tertiary uppercase block">Row Status Badges</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-success/15 text-status-cleared border border-status-cleared/30">
                <CheckCircle className="size-3" />
                Cleared
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-3 text-text-tertiary border border-border">
                <HelpCircle className="size-3" />
                Unclear
              </span>
            </div>
          </div>
        </div>

        {/* Live TimelineGrid Component */}
        <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card">
          <TimelineGrid />
        </div>
      </section>

      {/* 11. Evidence Board (React Flow) */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">Visual Graph Canvas</div>
          <h2 className="font-serif text-2xl font-semibold">Evidence Board (React Flow)</h2>
          <p className="text-text-secondary text-sm max-w-2xl">
            Interactive 2D graph canvas of suspects, soft statements, physical exhibits, flags, and hypotheses.
            Drawn with red threads of contradiction, dashed orange impossible journeys, and brass rehearsal edges.
          </p>
        </div>

        {/* Live EvidenceBoard Component */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-card">
          <EvidenceBoard />
        </div>
      </section>

      {/* 12. AI Inspector Reasoning Panel */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs text-brass uppercase tracking-wider">AI Copilot Feed</div>
          <h2 className="font-serif text-2xl font-semibold">AI Inspector Reasoning Stream</h2>
          <p className="text-text-secondary text-sm max-w-2xl">
            Streams real-time SSE tool calls, result rows, flags, hypotheses, and narrative conclusions.
            Supports deterministic assist, live cold case re-execution, and accusation pre-fill.
          </p>
        </div>

        {/* Live InspectorPanel Component */}
        <div className="p-4 rounded-xl bg-surface-1 border border-border shadow-card">
          <InspectorPanel />
        </div>
      </section>
    </div>
  );
}
