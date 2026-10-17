'use client';

import * as React from 'react';
import { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { CaseHeader } from '@/components/shell/CaseHeader';
import { CaseObjectiveBanner } from '@/components/shell/CaseObjectiveBanner';
import { SuspectsPanel } from '@/components/shell/SuspectsPanel';
import { InterrogationPanel } from '@/components/shell/InterrogationPanel';
import { FileTabsPanel } from '@/components/shell/FileTabsPanel';
import { BriefingModal } from '@/components/modals/BriefingModal';
import { SearchModal } from '@/components/modals/SearchModal';
import { BaitModal } from '@/components/modals/BaitModal';
import { AccuseModal } from '@/components/modals/AccuseModal';
import { ResetModal } from '@/components/modals/ResetModal';
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
    selectTab,
    setBriefingOpen,
    setBaitModalOpen,
    setAccuseModalOpen,
    isBriefingOpen,
    isBaitModalOpen,
    isAccuseModalOpen,
  } = useGameStore();

  React.useEffect(() => {
    initCase(level).then(() => {
      if (initialMode === 'cold_case') {
        runInspectorAction('cold_case');
      }
    });
  }, [level, initialMode, initCase, runInspectorAction]);

  React.useEffect(() => {
    if (isPresentMode) {
      document.documentElement.classList.add('present-mode');
      return () => {
        document.documentElement.classList.remove('present-mode');
      };
    }
  }, [isPresentMode]);

  // Global Keyboard Shortcuts (?, P, B, A, 1-4, Escape)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // '?' opens case briefing
      if (e.key === '?') {
        e.preventDefault();
        setBriefingOpen(!isBriefingOpen);
        return;
      }

      // 'p' toggles presentation mode
      if (key === 'p') {
        e.preventDefault();
        const url = new URL(window.location.href);
        if (url.searchParams.get('present') === '1') {
          url.searchParams.delete('present');
          document.documentElement.classList.remove('present-mode');
        } else {
          url.searchParams.set('present', '1');
          document.documentElement.classList.add('present-mode');
        }
        window.history.replaceState({}, '', url.toString());
        return;
      }

      // 'b' opens bait modal
      if (key === 'b') {
        if (caseData && caseData.baitsAllowed > 0) {
          e.preventDefault();
          setBaitModalOpen(!isBaitModalOpen);
        }
        return;
      }

      // 'a' opens accuse modal
      if (key === 'a') {
        e.preventDefault();
        setAccuseModalOpen(!isAccuseModalOpen);
        return;
      }

      // '1' to '4' switches tabs
      if (key === '1') {
        e.preventDefault();
        selectTab('timeline');
        return;
      }
      if (key === '2') {
        e.preventDefault();
        selectTab('board');
        return;
      }
      if (key === '3') {
        e.preventDefault();
        selectTab('inspector');
        return;
      }
      if (key === '4') {
        e.preventDefault();
        selectTab('notes');
        return;
      }

      // Escape closes open modals
      if (e.key === 'Escape') {
        setBriefingOpen(false);
        setBaitModalOpen(false);
        setAccuseModalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    caseData,
    isPresentMode,
    isBriefingOpen,
    isBaitModalOpen,
    isAccuseModalOpen,
    setBriefingOpen,
    setBaitModalOpen,
    setAccuseModalOpen,
    selectTab,
  ]);

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

      {/* Dynamic Detective Lead Banner */}
      <CaseObjectiveBanner />

      {/* Screen size recommendation notice */}
      <div className="xl:hidden py-1 px-4 bg-surface-2 border-b border-border text-center text-xs font-mono text-text-secondary">
        Best on a larger screen (1440×900 or 1920×1080)
      </div>

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
      <ResetModal />
    </div>
  );
}

function PlayPageWrapper({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params);
  return <PlayPageContent level={level} />;
}

export default function PlayPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
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
      <PlayPageWrapper params={params} />
    </Suspense>
  );
}
