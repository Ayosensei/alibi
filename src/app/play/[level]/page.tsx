'use client';

import * as React from 'react';
import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { CaseHeader } from '@/components/shell/CaseHeader';
import { SuspectsPanel } from '@/components/shell/SuspectsPanel';
import { InterrogationPanel } from '@/components/shell/InterrogationPanel';
import { FileTabsPanel } from '@/components/shell/FileTabsPanel';
import { BriefingModal } from '@/components/modals/BriefingModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { BaitModal } from '@/components/modals/BaitModal';
import { AccuseModal } from '@/components/modals/AccuseModal';
import { ErrorBanner } from '@/components/atoms';
import { Loader2 } from 'lucide-react';


function PlayPageContent({ level }: { level: string }) {
  const searchParams = useSearchParams();
  const isPresentMode = searchParams.get('present') === '1';
  const initialMode = searchParams.get('mode');

  const {
    caseData,
    isLoading,
    error,
    initCase,
    runInspectorAction,
  } = useGameStore();

  React.useEffect(() => {
    initCase(level).then(() => {
      if (initialMode === 'cold_case') {
        runInspectorAction('cold_case');
      }
    });
  }, [level, initialMode, initCase, runInspectorAction]);

  if (isLoading && !caseData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-brass" />
        <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
          Opening Dossier {level}...
        </span>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <ErrorBanner
          message="Could not load the requested case file."
          hint={error}
          onRetry={() => initCase(level)}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-background text-text-primary ${
        isPresentMode ? 'text-lg' : ''
      }`}
    >
      {/* 56px Header */}
      <CaseHeader />

      {/* Main 3-Column Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-3.5rem)]">
        <SuspectsPanel />
        <InterrogationPanel />
        <FileTabsPanel />
      </main>

      {/* Case Briefing, Search, Bait & Accuse Modals */}
      <BriefingModal />
      <SearchModal />
      <BaitModal />
      <AccuseModal />
    </div>
  );
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
          <Loader2 className="size-8 animate-spin text-brass" />
          <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
            Loading Case Environment...
          </span>
        </div>
      }
    >
      <PlayPageContent level={level} />
    </Suspense>
  );
}
