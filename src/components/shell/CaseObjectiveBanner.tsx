'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { Compass, Clock, Search, LayoutGrid, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function CaseObjectiveBanner() {
  const {
    caseId,
    caseData,
    board,
    contradictions,
    rehearsed,
    clearedSuspects,
    progress,
    lastVerdict,
    selectTab,
    selectedTab,
    setAccuseModalOpen,
  } = useGameStore();

  if (!caseData) return null;

  const isCaseSolved = Boolean(
    progress[caseId]?.solved || lastVerdict?.result === 'full'
  );

  if (isCaseSolved) {
    return (
      <div className="bg-surface-2 border-b border-border px-4 py-1.5 flex items-center justify-between gap-3 text-xs select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="size-3.5 text-status-cleared shrink-0" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-status-cleared hidden sm:inline">
              Case Solved:
            </span>
          </div>
          <p className="text-xs text-text-primary truncate font-medium">
            All conspirators exposed and verified! Review the dossier, evidence board, or verdict report.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link href={`/play/${caseId}/verdict`}>
            <Button
              variant="brass"
              size="sm"
              className="h-6 px-2.5 text-xs shadow-xs"
            >
              View Verdict
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeWindow = board?.window ?? caseData.publicWindow ?? [5];
  const murderSlot = activeWindow[0] ?? 5;
  const murderTime = caseData.slots[murderSlot - 1] ?? `Slot ${murderSlot}`;
  const crimeScene = caseData.crimeScene.replace(/_/g, ' ');

  // Progression metrics
  const suspects = caseData.people.filter((p) => !p.victim);
  const totalSuspects = suspects.length;
  const murderStatements = (board?.statements ?? []).filter(
    (s) => s.slot === murderSlot && s.kind === 'location'
  );
  const crimeSceneSearched = (board?.searchedRooms ?? []).includes(caseData.crimeScene);
  const hasContradictions = (contradictions?.length ?? 0) > 0;
  const hasRehearsed = (rehearsed?.length ?? 0) > 0;
  const clearedCount = Object.keys(clearedSuspects ?? {}).length;

  // Determine active lead stage
  let leadText = '';
  let icon = <Compass className="size-3.5 text-brass shrink-0" />;
  let actionButton: React.ReactNode = null;

  if (murderStatements.length < totalSuspects) {
    icon = <Clock className="size-3.5 text-brass shrink-0 animate-pulse" />;
    leadText = `Interrogate suspects about their whereabouts at ${murderTime} (Time of Murder).`;
    actionButton = (
      <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-3 text-brass border border-border">
        {murderStatements.length}/{totalSuspects} Questioned
      </span>
    );
  } else if (!crimeSceneSearched) {
    icon = <Search className="size-3.5 text-brass shrink-0" />;
    leadText = `Suspects questioned. Search the crime scene (${crimeScene}) in the left sidebar to verify their alibis.`;
  } else if (!hasContradictions) {
    icon = <LayoutGrid className="size-3.5 text-brass shrink-0" />;
    leadText = 'Physical evidence discovered! Open the Timeline or Board to compare stories against logs.';
    if (selectedTab !== 'timeline') {
      actionButton = (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => selectTab('timeline')}
          className="h-6 px-2 text-xs"
        >
          View Timeline
        </Button>
      );
    }
  } else if (clearedCount === 0 && !hasRehearsed) {
    icon = <Compass className="size-3.5 text-brass shrink-0" />;
    leadText = 'Contradictions detected! Ask the Inspector or examine the map to verify who could physically reach the scene.';
    if (selectedTab !== 'inspector') {
      actionButton = (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => selectTab('inspector')}
          className="h-6 px-2 text-xs"
        >
          Consult Inspector
        </Button>
      );
    }
  } else {
    icon = <ShieldAlert className="size-3.5 text-thread shrink-0" />;
    leadText = 'Lies exposed and innocent suspects cleared! You have enough evidence to close the case.';
    actionButton = (
      <Button
        variant="default"
        size="sm"
        onClick={() => setAccuseModalOpen(true)}
        className="h-6 px-2.5 text-xs shadow-xs"
      >
        File Accusation
      </Button>
    );
  }

  return (
    <div className="bg-surface-2 border-b border-border px-4 py-1.5 flex items-center justify-between gap-3 text-xs select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {icon}
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brass hidden sm:inline">
            Active Lead:
          </span>
        </div>
        <p className="text-xs text-text-primary truncate font-medium">
          {leadText}
        </p>
      </div>

      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
}
