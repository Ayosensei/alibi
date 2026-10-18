'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  Compass,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  ExternalLink,
} from 'lucide-react';

interface Case0CoachProps {
  onDismiss?: () => void;
}

export function Case0Coach({ onDismiss }: Case0CoachProps) {
  const {
    caseData,
    board,
    selectedSuspectId,
    contradictions,
    clearedSuspects,
    isAccuseModalOpen,
    initCase,
    setAccuseModalOpen,
  } = useGameStore();

  const statements = board?.statements ?? [];
  const hardAnchors = board?.hardAnchors ?? [];

  // Determine active step dynamically
  // Step 1: Select Dee
  // Step 2: Ask whereabouts at 8:20
  // Step 3: Search Hall
  // Step 4: Review Pocket Graph (Contradiction & Impossible Move)
  // Step 5: Accuse Dee
  const hasSelectedDee = selectedSuspectId === 'dee';
  const hasDeeStatement = statements.some((s) => s.by === 'dee');
  const hasSearchedHall = hardAnchors.some((a) => a.room === 'hall');
  const hasClash = contradictions.length > 0;

  let step = 1;
  let stepTitle = 'Select Suspect Dee';
  let stepInstructions =
    'Click on Dee in the dossier (left column). Look at the Pocket Graph below—her node starts in a clean, blank state.';

  if (!hasDeeStatement && !hasSelectedDee) {
    step = 1;
    stepTitle = 'Select Suspect Dee';
    stepInstructions =
      'Step 1: Click on Dee in the dossier (left column). Look at the Pocket Graph below—all players start in a blank state.';
  } else if (!hasDeeStatement) {
    step = 2;
    stepTitle = 'Inquire About Whereabouts at 8:20';
    stepInstructions =
      'Step 2: In the center panel, click "Where were you at 8:20?". Watch Dee connect to the Lounge on your Pocket Graph below!';
  } else if (!hasSearchedHall) {
    step = 3;
    stepTitle = 'Search the Hall for Scene Evidence';
    stepInstructions =
      'Step 3: In the left dossier under Rooms, click "Search" on the Hall. Physical evidence will register on your Pocket Graph.';
  } else if (!isAccuseModalOpen && hasClash) {
    step = 4;
    stepTitle = 'Read the Pocket Graph';
    stepInstructions =
      'Step 4: Check your Pocket Graph below! FalkorDB caught Dee in a red CONTRADICTION (Q60) with the Hall Log, while Mr. Okoye is CLEARED by an IMPOSSIBLE MOVE (Q63). Dee is the lone culprit!';
  } else {
    step = 5;
    stepTitle = 'Accuse the True Culprit';
    stepInstructions =
      'Step 5: Click "Accuse" in the top header and select Dee. Close the case with 100% graph confidence!';
  }

  const handleResetCase0 = async () => {
    await initCase('l1-quiet-pact', true);
  };

  return (
    <div className="w-full bg-surface-2 border-b-2 border-brass/60 px-4 py-2.5 shadow-card shrink-0 select-none animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brass/15 border border-brass/40 shrink-0">
            <Compass className="size-3.5 text-brass" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brass">
              Case 0 Walkthrough · Step {step} of 5
            </span>
          </div>

          <div className="min-w-0">
            <span className="font-serif font-bold text-xs sm:text-sm text-text-primary mr-2 block sm:inline">
              {stepTitle}:
            </span>
            <span className="text-xs text-text-secondary">
              {stepInstructions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetCase0}
            className="h-7 px-2.5 text-xs text-text-secondary hover:text-text-primary gap-1"
            title="Reset Case 0 to practice again from tick 0"
          >
            <RotateCcw className="size-3 text-brass" />
            <span>Replay Case 0</span>
          </Button>

          {step === 4 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setAccuseModalOpen(true)}
              className="h-7 px-3 text-xs gap-1"
            >
              <span>Accuse Dee</span>
              <ArrowRight className="size-3 ml-0.5" />
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 px-2 text-xs text-text-tertiary hover:text-text-primary"
            >
              Exit Tour
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
