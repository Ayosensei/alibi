'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Chip, Stamp, Polaroid } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  FolderOpen,
  Lock,
  Star,
  Play,
  RotateCw,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface CaseMeta {
  id: string;
  levelNumber: number;
  title: string;
  tagline: string;
  mechanics: string;
  crimeScene: string;
  arcClueText: string;
}

const CASES: CaseMeta[] = [
  {
    id: 'l1-quiet-pact',
    levelNumber: 1,
    title: 'The Quiet Pact',
    tagline: 'Three suspects claim they were together in the prop store. The electronic lock log says none of them entered.',
    mechanics: 'Direct Contradictions · Rehearsed Alibis',
    crimeScene: 'prop_store',
    arcClueText: 'A torn ledger fragment mentioning the Vale family shipping trust.',
  },
  {
    id: 'l2-stopped-watch',
    levelNumber: 2,
    title: 'The Stopped Watch',
    tagline: 'A shattered pocket watch anchors the murder to an exact minute. One suspect could not physically cross the estate in time.',
    mechanics: 'Impossible Moves · Mansion Graph Distances',
    crimeScene: 'library',
    arcClueText: 'A ciphered note addressed to "The Consultant" with a stamped seal.',
  },
  {
    id: 'l3-blackout-dinner',
    levelNumber: 3,
    title: 'The Blackout Dinner',
    tagline: 'Six dinner guests in pitch darkness. The circuit breaker was thrown by someone navigating a hidden library corridor.',
    mechanics: 'Single-Survivor Elimination · Motive Paths · Sharp Baiting',
    crimeScene: 'study',
    arcClueText: 'A vintage shipping charter proving Edmund Vale intended to disinherit his partners.',
  },
];

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function Season1Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPresentMode = searchParams.get('present') === '1';

  const { progress, resetCaseProgress, resetAllProgress } = useGameStore();
  const [skipLock, setSkipLock] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  React.useEffect(() => {
    if (isPresentMode) {
      document.documentElement.classList.add('present-mode');
      return () => {
        document.documentElement.classList.remove('present-mode');
      };
    }
  }, [isPresentMode]);

  const isUnlocked = (lvlIndex: number) => {
    if (skipLock) return true;
    if (lvlIndex === 0) return true;
    const prevCaseId = CASES[lvlIndex - 1].id;
    return progress[prevCaseId]?.solved ?? false;
  };

  const handlePlay = (caseId: string, cold = false) => {
    const query = new URLSearchParams();
    if (cold) query.set('mode', 'cold_case');
    if (isPresentMode) query.set('present', '1');
    const qStr = query.toString() ? `?${query.toString()}` : '';
    router.push(`/play/${caseId}${qStr}`);
  };

  const handleResetSingle = async (caseId: string) => {
    if (typeof window !== 'undefined' && window.confirm('Reset this case to start over fresh?')) {
      setIsResetting(true);
      try {
        await resetCaseProgress(caseId);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleResetAll = async () => {
    if (typeof window !== 'undefined' && window.confirm('Reset all season progress and lock dossiers again?')) {
      setIsResetting(true);
      try {
        await resetAllProgress();
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-background text-text-primary p-6 md:p-12 max-w-6xl mx-auto space-y-12 ${isPresentMode ? 'text-lg' : ''}`}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-6 gap-4">
        <div className="space-y-1.5">
          <div className="font-mono text-xs uppercase tracking-widest text-brass">
            Season 1 · Three Cases
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
            Case <span className="italic font-normal text-thread">Dossiers</span>
          </h1>
          <p className="text-text-secondary text-xs md:text-sm max-w-xl">
            Examine the suspects, traverse the physical crime scene topology, and isolate the truth using graph reasoning.
          </p>
        </div>

        {/* Actions (Hidden in Present Mode) */}
        {!isPresentMode && (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={isResetting}
              onClick={handleResetAll}
              className="text-xs text-text-tertiary hover:text-thread hover:bg-surface-2 gap-1.5"
              title="Reset all season progress and lock dossiers"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset All Progress</span>
            </Button>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipLock}
                  onChange={(e) => setSkipLock(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-thread accent-primary"
                />
                <span>Skip locks (Dev)</span>
              </label>
            </div>
          </div>
        )}
      </header>

      {/* Case Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CASES.map((caseMeta, idx) => {
          const unlocked = isUnlocked(idx);
          const prog = progress[caseMeta.id] ?? { stars: 0, solved: false, accusationsUsed: 0 };

          return (
            <div
              key={caseMeta.id}
              className={`flex flex-col justify-between p-6 rounded-xl border shadow-card transition-all duration-200 ${
                unlocked
                  ? 'bg-surface-1 border-border hover:border-border-strong hover:bg-surface-2'
                  : 'bg-surface-1/50 border-border/40 opacity-70'
              }`}
            >
              <div className="space-y-4">
                {/* Folder Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {unlocked ? (
                      <FolderOpen className="size-4 text-brass" />
                    ) : (
                      <Lock className="size-4 text-text-tertiary" />
                    )}
                    <span className="font-mono text-xs font-semibold tracking-widest text-brass uppercase">
                      CASE FILE 0{caseMeta.levelNumber}
                    </span>
                  </div>

                  {/* Stars Rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`size-3.5 ${
                          starIdx <= prog.stars
                            ? 'text-brass fill-brass'
                            : 'text-surface-3 fill-surface-3'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold text-text-primary">
                    {caseMeta.title}
                  </h3>
                  <p className="font-sans text-xs text-text-secondary leading-relaxed line-clamp-3">
                    {caseMeta.tagline}
                  </p>
                </div>

                {/* Mechanics Pill */}
                <div className="pt-1">
                  <Chip variant="default" className="text-xs">
                    {caseMeta.mechanics}
                  </Chip>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-6 border-t border-border/60 mt-6 flex flex-col gap-2">
                {unlocked ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="default"
                        onClick={() => handlePlay(caseMeta.id, false)}
                        className="flex-1 justify-between"
                      >
                        <span>{prog.solved ? 'Review / Play' : 'Play Case'}</span>
                        <ArrowRight className="size-4" />
                      </Button>
                      {prog.solved && (
                        <Button
                          variant="outline"
                          size="default"
                          disabled={isResetting}
                          onClick={() => handleResetSingle(caseMeta.id)}
                          className="px-3 text-text-secondary hover:text-thread hover:bg-surface-3"
                          title="Reset this case graph and progress to solve from scratch"
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePlay(caseMeta.id, true)}
                      className="w-full justify-center text-xs text-text-secondary hover:text-text-primary"
                    >
                      <RotateCw className="size-3.5 mr-1 text-inspector" />
                      Recorded Cold Case
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-2 text-xs text-text-tertiary gap-1.5">
                    <Lock className="size-3.5" />
                    <span>Complete Case 0{idx} to unlock</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Corkboard Arc Clues Section */}
      <section className="p-6 md:p-8 rounded-xl bg-surface-1 border border-border shadow-card space-y-6">
        <div className="space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-brass">
            Investigation Archive · Corkboard
          </div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">
            Season 1 <span className="italic font-normal text-thread">Arc Clues</span>
          </h2>
          <p className="text-text-secondary text-xs md:text-sm max-w-xl">
            Recovered exhibits from solved cases reveal the conspiracy connecting the three murder mysteries.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 items-start pt-2">
          {CASES.map((c, i) => {
            const prog = progress[c.id];
            const isSolved = prog?.solved;

            return (
              <div key={c.id}>
                {isSolved ? (
                  <Polaroid
                    id={`arc_${c.id}`}
                    kind="evidence"
                    label={`CASE 0${i + 1} EXHIBIT`}
                    title={`The Vale Trust Dossier #${i + 1}`}
                    text={c.arcClueText}
                    source="Archive Item"
                  />
                ) : (
                  <div className="w-64 h-48 rounded-sm border-2 border-dashed border-border/80 bg-surface-2/40 flex flex-col items-center justify-center p-4 text-center gap-2 select-none">
                    <Lock className="size-5 text-text-tertiary" />
                    <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                      Case 0{i + 1} Locked Clue
                    </span>
                    <span className="text-xs text-text-tertiary/70">
                      Solve {c.title} to pin this evidence.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function Season1Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Season1Content />
    </Suspense>
  );
}
