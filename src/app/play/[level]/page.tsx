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
import { Button } from '@/components/ui/button';
import { Loader2, Users, MessageSquare, LayoutGrid } from 'lucide-react';


function PlayPageContent({ level }: { level: string }) {
  const searchParams = useSearchParams();
  const isPresentMode = searchParams.get('present') === '1';
  const initialMode = searchParams.get('mode');

  const {
    caseId,
    caseData,
    isLoading,
    error,
    initCase,
    runInspectorAction,
    selectTab,
    selectedSuspectId,
    setBriefingOpen,
    setBaitModalOpen,
    setAccuseModalOpen,
    isBriefingOpen,
    isBaitModalOpen,
    isAccuseModalOpen,
  } = useGameStore();

  const [mobileTab, setMobileTab] = React.useState<'suspects' | 'interrogation' | 'tabs'>('suspects');

  React.useEffect(() => {
    if (selectedSuspectId) {
      setMobileTab('interrogation');
    }
  }, [selectedSuspectId]);

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

  const isCaseReady = Boolean(caseData && caseId === level);

  if (isLoading && !isCaseReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="size-8 animate-spin text-brass" />
        <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
          Opening Dossier {level}...
        </span>
      </div>
    );
  }

  if (error && !isCaseReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <ErrorBanner
          message="Could not load the requested case file."
          hint={error}
          onRetry={() => initCase(level, true)}
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

      {/* Mobile Workspace Switcher (< lg) */}
      <div className="lg:hidden flex items-center border-b border-border bg-surface-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileTab('suspects')}
          className={`flex-1 rounded-none h-11 text-xs font-mono border-b-2 transition-colors ${
            mobileTab === 'suspects'
              ? 'border-brass text-text-primary bg-surface-1 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users className="size-3.5 mr-1.5" />
          Dossier
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileTab('interrogation')}
          className={`flex-1 rounded-none h-11 text-xs font-mono border-b-2 transition-colors ${
            mobileTab === 'interrogation'
              ? 'border-brass text-text-primary bg-surface-1 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <MessageSquare className="size-3.5 mr-1.5" />
          Interrogate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileTab('tabs')}
          className={`flex-1 rounded-none h-11 text-xs font-mono border-b-2 transition-colors ${
            mobileTab === 'tabs'
              ? 'border-brass text-text-primary bg-surface-1 font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <LayoutGrid className="size-3.5 mr-1.5" />
          Board & Tabs
        </Button>
      </div>

      {/* Main Layout: On desktop all 3 side-by-side; on mobile only the active tab */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-7rem)] lg:min-h-[calc(100vh-3.5rem)]">
        <div
          className={`w-full lg:w-72 xl:w-80 shrink-0 h-full min-w-0 overflow-hidden ${
            mobileTab === 'suspects' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <SuspectsPanel />
        </div>
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'interrogation' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <InterrogationPanel />
        </div>
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === 'tabs' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
          }`}
        >
          <FileTabsPanel />
        </div>
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
