'use client';

import * as React from 'react';
import { use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Stamp, Chip, Polaroid } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import type { AccuseOutput } from '@/lib/api';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Crosshair,
  Sparkles,
  Search,
  BookOpen,
  MapPin,
  Layers,
  HelpCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

const NEXT_LEVEL_MAP: Record<string, string> = {
  'l1-quiet-pact': 'l2-stopped-watch',
  'l2-stopped-watch': 'l3-blackout-dinner',
};

const DEFAULT_DEMO_VERDICT: AccuseOutput = {
  result: 'full',
  wrongLeft: 2,
  levelOver: true,
  stars: 3,
  revealed: {
    culprits: ['kofi', 'dee', 'hana'],
    method: 'A blow to the head during an argument about the sale of the playhouse.',
    weapon: 'Brass lamp stand',
  },
  replay: [
    {
      title: 'Establish Murder Window',
      detail: 'The stage manager log and prop store door access establish the fatal confrontation occurred at 9:30 (slot 5).',
      refs: ['e1_doorlog'],
      path: ['foyer', 'prop_store'],
    },
    {
      title: 'Fabricated Rehearsed Alibi',
      detail: 'Dee, Kofi, and Hana each claimed to be in the prop store together, reciting identical phrases about the prop bell.',
      refs: ['c1_dee_loc5', 'c1_kofi_loc5', 'c1_hana_loc5'],
      path: ['prop_store', 'green_room'],
    },
    {
      title: 'Physical Door Access Contradiction',
      detail: 'The electronic door access log proves only Okoye was in the green room corridor, contradicting their alibi chain.',
      refs: ['e1_doorlog', 'c1_dee_saw_kofi'],
      path: ['prop_store', 'foyer'],
    },
    {
      title: 'Exclusion of Innocent Bystanders',
      detail: 'Okoye was locked at the box office ticket booth throughout slot 5, physically cleared of opportunity.',
      refs: ['e1_ticket_ledger'],
      path: ['foyer'],
    },
  ],
  found: [
    'Contradiction established between Dee\'s claim and door access log.',
    'Rehearsed alibi identified across Dee, Kofi, and Hana\'s statements.',
    'Elimination proved Okoye was physically confined to box office.',
  ],
  missed: [],
};

function VerdictContent({ level }: { level: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPresentMode = searchParams.get('present') === '1';

  const { caseData, initCase, lastVerdict, resetCaseProgress } = useGameStore();
  const [isReplaying, setIsReplaying] = React.useState(false);

  const [verdictData, setVerdictData] = React.useState<AccuseOutput>(
    () => lastVerdict ?? DEFAULT_DEMO_VERDICT
  );
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0);

  const handleReplayFromScratch = async () => {
    setIsReplaying(true);
    try {
      await resetCaseProgress(level);
      router.push(`/play/${level}`);
    } finally {
      setIsReplaying(false);
    }
  };

  // Present mode class toggle
  React.useEffect(() => {
    if (isPresentMode) {
      document.documentElement.classList.add('present-mode');
      return () => {
        document.documentElement.classList.remove('present-mode');
      };
    }
  }, [isPresentMode]);

  // Initialize case data if needed
  React.useEffect(() => {
    if (!caseData) {
      initCase(level);
    }
  }, [level, caseData, initCase]);

  // Sync or restore verdict data from localStorage if store is empty on refresh
  React.useEffect(() => {
    if (lastVerdict) {
      setVerdictData(lastVerdict);
    } else if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`alibi_verdict_${level}`);
        if (cached) {
          setVerdictData(JSON.parse(cached));
        }
      } catch {
        // ignore
      }
    }
  }, [level, lastVerdict]);

  const isCaseClosed = verdictData?.result === 'full';
  const starsCount = verdictData?.stars ?? (isCaseClosed ? 1 : 0);
  const nextLevel = NEXT_LEVEL_MAP[level];

  const culpritNames =
    verdictData?.revealed?.culprits
      .map((cid) => {
        const p = caseData?.people.find((person) => person.id === cid);
        return p ? `${p.name} (${p.role})` : cid;
      })
      .join(', ') ?? 'Conspirators Unrevealed';

  return (
    <div
      className={`min-h-screen bg-background text-text-primary p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 ${
        isPresentMode ? 'text-lg' : ''
      }`}
    >
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/play/${level}`}
            className="text-text-secondary hover:text-text-primary p-1.5 -ml-1 rounded transition-colors"
            title="Back to Case File"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-brass font-semibold">
                CASE DOSSIER {caseData ? `0${caseData.level}` : level}
              </span>
              <span className="text-border-strong">/</span>
              <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                Official Inquest
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
              {isCaseClosed ? (
                <>
                  Case <span className="italic font-normal text-brass">Closed</span>
                </>
              ) : (
                <>
                  Investigation <span className="italic font-normal text-thread">Inconclusive</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* Verdict Stamp & Stars */}
        <div className="flex flex-col sm:items-end gap-2.5">
          <div className="flex items-center gap-3">
            {isCaseClosed ? (
              <Stamp status="cleared" label="CASE CLOSED" className="text-sm px-3.5 py-1" />
            ) : (
              <Stamp status="contradiction" label="NOT QUITE" className="text-sm px-3.5 py-1" />
            )}

            {/* 3 Brass Stars */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-2 border border-border">
              {[1, 2, 3].map((starNum) => (
                <Star
                  key={starNum}
                  className={`size-5 ${
                    starNum <= starsCount
                      ? 'fill-brass text-brass'
                      : 'text-border-strong opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {isCaseClosed
              ? `Mastery Rating: ${starsCount} / 3 Stars Earned`
              : 'Conspiracy Partially Exposed'}
          </span>
        </div>
      </div>

      {!verdictData ? (
        /* Empty / No Verdict Recorded State */
        <div className="p-12 rounded-xl bg-surface-1 border border-border text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="size-10 text-brass mx-auto" />
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              No Verdict on File
            </h2>
            <p className="text-xs text-text-secondary">
              You haven&apos;t delivered a formal accusation for this case session yet. Return to the investigation room to interrogate suspects and build your case.
            </p>
          </div>
          <Button
            variant="default"
            size="default"
            onClick={() => router.push(`/play/${level}`)}
          >
            Open Case Investigation
          </Button>
        </div>
      ) : (
        /* 2-Column Verdict Main Body */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Replay Summary (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-brass" />
                <span className="font-mono text-xs uppercase tracking-widest text-brass">
                  Case Reconstruction
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-text-primary">
                Step-by-Step <span className="italic font-normal text-brass">Replay</span>
              </h2>
              <p className="text-xs text-text-secondary">
                The authoritative chain of logic establishing the truth from physical contradictions to motive.
              </p>
            </div>

            {/* Replay Steps List */}
            {verdictData.replay && verdictData.replay.length > 0 ? (
              <div className="space-y-3.5">
                {verdictData.replay.map((step, idx) => {
                  const isActive = activeStepIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-3 ${
                        isActive
                          ? 'bg-surface-2 border-brass/70 shadow-floating'
                          : 'bg-surface-1 border-border hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                              isActive
                                ? 'bg-brass text-on-brass'
                                : 'bg-surface-3 text-text-secondary'
                            }`}
                          >
                            STEP 0{idx + 1}
                          </span>
                          <h3 className="font-medium text-sm text-text-primary">
                            {step.title}
                          </h3>
                        </div>

                        {step.refs.length > 0 && (
                          <Chip variant="default" className="text-xs">
                            {step.refs.length} {step.refs.length === 1 ? 'evidence' : 'proofs'}
                          </Chip>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed pl-1">
                        {step.detail}
                      </p>

                      {/* Expanded references & paths */}
                      {isActive && (
                        <div className="pt-2 border-t border-border/60 space-y-2.5 animate-in fade-in duration-200">
                          {step.refs.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary block">
                                Referenced Board Nodes
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {step.refs.map((ref) => (
                                  <span
                                    key={ref}
                                    className="font-mono text-xs px-2 py-0.5 rounded bg-surface-3 border border-border text-text-primary"
                                  >
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.path && step.path.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary block">
                                Trajectory / Inquest Path
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-brass">
                                {step.path.map((node, pIdx) => (
                                  <React.Fragment key={pIdx}>
                                    <span className="px-2 py-0.5 rounded bg-brass/10 border border-brass/30">
                                      {node}
                                    </span>
                                    {pIdx < step.path.length - 1 && (
                                      <ArrowRight className="size-3 text-border-strong shrink-0" />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-secondary italic">
                No replay data available for this session.
              </p>
            )}
          </div>

          {/* Right Column: Truth Reveal & Proof Balance (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Ground Truth Reveal Card (Only shown on verdict screen) */}
            <div className="p-5 rounded-xl bg-surface-2 border border-brass/50 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2 text-brass">
                  <ShieldAlert className="size-4" />
                  <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                    Ground Truth Revealed
                  </span>
                </div>
                <Stamp status="cleared" label="OFFICIAL RECORD" />
              </div>

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                    Conspirators & Culprits
                  </span>
                  <p className="font-serif text-base font-semibold text-text-primary">
                    {culpritNames}
                  </p>
                </div>

                {verdictData.revealed?.weapon && (
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                      Murder Weapon
                    </span>
                    <p className="text-xs font-mono text-text-primary">
                      {verdictData.revealed.weapon}
                    </p>
                  </div>
                )}

                {verdictData.revealed?.method && (
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                      Method & Motive
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {verdictData.revealed.method}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* What You Found */}
            <div className="p-5 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
              <div className="flex items-center gap-2 text-status-cleared">
                <CheckCircle2 className="size-4" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                  What You Established ({verdictData.found.length})
                </h3>
              </div>
              {verdictData.found.length > 0 ? (
                <ul className="space-y-2">
                  {verdictData.found.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-text-primary flex items-start gap-2 pl-1"
                    >
                      <span className="size-1.5 rounded-full bg-status-cleared shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-secondary italic">
                  No proof items were fully assembled on your board.
                </p>
              )}
            </div>

            {/* What You Missed */}
            <div className="p-5 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
              <div className="flex items-center gap-2 text-status-impossible">
                <AlertCircle className="size-4" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider">
                  What You Missed ({verdictData.missed.length})
                </h3>
              </div>
              {verdictData.missed.length > 0 ? (
                <ul className="space-y-2">
                  {verdictData.missed.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-text-secondary flex items-start gap-2 pl-1"
                    >
                      <span className="size-1.5 rounded-full bg-status-impossible shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-status-cleared font-medium">
                  Flawless deduction. Every contradiction, rehearsed alibi, and movement violation was found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer: Season 1 Arc Clue & Next Actions */}
      <footer className="border-t border-border pt-8 space-y-6">
        {caseData?.arcClue && isCaseClosed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brass">
              <Sparkles className="size-4" />
              <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                Season 1 Arc Evidence Discovered
              </span>
            </div>
            <div className="max-w-md">
              <Polaroid
                id={`arc-${level}`}
                label="CONFIDENTIAL ARCHIVE CLUE"
                title={`File 0${caseData.level} Secret Note`}
                text={caseData.arcClue}
                source="Recovered following case resolution"
                isFlagged={true}
                stamp={{ label: 'SEASON 1 EVIDENCE', status: 'cleared' }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/play/${level}`}>
              <Button variant="secondary" size="default">
                Review Case Dossier
              </Button>
            </Link>
            <Button
              variant="outline"
              size="default"
              disabled={isReplaying}
              onClick={handleReplayFromScratch}
              className="text-text-primary hover:bg-surface-2 gap-1.5"
            >
              <RotateCcw className="size-4 text-brass" />
              Replay From Scratch
            </Button>
            <Link href="/season/1">
              <Button variant="ghost" size="default">
                Return to Dossiers Map
              </Button>
            </Link>
          </div>

          {nextLevel ? (
            <Link href={`/play/${nextLevel}`}>
              <Button variant="default" size="default">
                Next Case Dossier
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Link href="/season/1">
              <Button variant="default" size="default">
                All Cases Complete — View Season 1
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}

function VerdictWrapper({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params);
  return <VerdictContent level={level} />;
}

export default function VerdictPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="size-8 animate-spin text-brass" />
          <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
            Compiling Inquest Report...
          </span>
        </div>
      }
    >
      <VerdictWrapper params={params} />
    </Suspense>
  );
}
