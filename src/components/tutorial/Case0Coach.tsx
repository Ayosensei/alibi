'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import {
  Compass,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface Case0CoachProps {
  onDismiss?: () => void;
  specimenMode?: boolean;
}

export function Case0Coach({ onDismiss, specimenMode = false }: Case0CoachProps) {
  const {
    caseData,
    board,
    selectedSuspectId,
    contradictions,
    clearedSuspects,
    isAccuseModalOpen,
    caseId,
    progress,
    lastVerdict,
    initCase,
    setAccuseModalOpen,
  } = useGameStore();

  const statements = board?.statements ?? [];
  const hardAnchors = board?.hardAnchors ?? [];
  const isSolved = Boolean(
    (caseId && progress[caseId]?.solved) || lastVerdict?.result === 'full'
  );

  const hasSelectedDee = selectedSuspectId === 'dee';
  const hasDeeStatement = statements.some((s) => s.by === 'dee');
  const hasSearchedHall = hardAnchors.some((a) => a.room === 'hall');
  const hasClash = contradictions.length > 0;

  // Track step acknowledgement
  const [step4Acknowledged, setStep4Acknowledged] = React.useState(false);
  const [showCenterModal, setShowCenterModal] = React.useState(!specimenMode);
  const [lastStep, setLastStep] = React.useState(1);

  // Derive logical active step (1..6)
  let activeStep = 1;
  if (isSolved) {
    activeStep = 6;
  } else if (isAccuseModalOpen || (hasSearchedHall && hasDeeStatement && step4Acknowledged)) {
    activeStep = 5;
  } else if (hasSearchedHall && hasDeeStatement) {
    activeStep = 4;
  } else if (hasDeeStatement) {
    activeStep = 3;
  } else if (hasSelectedDee) {
    activeStep = 2;
  } else {
    activeStep = 1;
  }

  // When step transitions, reopen the darkened center modal automatically
  React.useEffect(() => {
    if (activeStep !== lastStep) {
      setLastStep(activeStep);
      setShowCenterModal(true);
    }
  }, [activeStep, lastStep]);

  // Target element selector and messages per step
  let targetSelector = '[data-suspect-id="dee"]';
  let stepTitle = 'Step 1: Inspect Suspect Dee';
  let stepSubtitle = 'The Blank Starting State';
  let modalDescription =
    'Welcome Detective. Lord Harrington has been poisoned tonight in his estate. Every fact and statement you discover lives as a node in your live FalkorDB knowledge graph.\n\nFirst, select Dee from the suspect dossier in the left panel. Look at your Pocket Graph below—all suspect nodes start in a clean, blank slate.';
  let falkorDetail =
    'FalkorDB stores suspects as (:Person) nodes. Currently, no claims (:CLAIMED) or anchors (:IN_ROOM) exist in your play graph.';
  let actionButtonLabel = 'Show Me Dee →';
  let beaconTooltip = 'Click Dee to open her dossier.';

  if (activeStep === 2) {
    targetSelector = '[data-lead-button="murder-window"]';
    stepTitle = 'Step 2: Interrogate Dee for an Alibi';
    stepSubtitle = 'Extracting Authored Claims';
    modalDescription =
      'Suspects may attempt to lie, but their statements are bound to authored claims by our LLM Firewall. Each statement writes a live (:CLAIMED) relationship to FalkorDB.\n\nIn the interrogation room, ask Dee: "Where were you at 8:20?". Watch her claimed location connect to the Lounge on your Pocket Graph.';
    falkorDetail =
      'FalkorDB executes: MATCH (p:Person {id: "dee"}), (r:Room {id: "lounge"}) CREATE (p)-[:CLAIMED {at: 5}]->(r)';
    actionButtonLabel = 'Guide Me to Question →';
    beaconTooltip = 'Click "Where were you at 8:20?" to interrogate Dee.';
  } else if (activeStep === 3) {
    targetSelector = '[data-room-search="hall"]';
    stepTitle = 'Step 3: Sweep the Estate for Hard Evidence';
    stepSubtitle = 'Ground Truth Scene Anchors';
    modalDescription =
      'Suspects can fabricate alibis, but physical scene evidence cannot lie. Ground truth exhibits become unshakeable (:Anchor) nodes in your graph.\n\nUnder Rooms in the left dossier, click "Search" on the Hall to inspect electronic passcard and motion logs.';
    falkorDetail =
      'FalkorDB registers scene evidence: CREATE (:Anchor:Exhibit {type: "passcard_log", room: "hall", at: 5})';
    actionButtonLabel = 'Guide Me to Search the Hall →';
    beaconTooltip = 'Click Search on the Hall to reveal physical evidence.';
  } else if (activeStep === 4) {
    targetSelector = '[data-phone-container="true"]';
    stepTitle = 'Step 4: Read the Pocket Graph Reasoning';
    stepSubtitle = 'FalkorDB Traversal & Contradiction Detection';
    modalDescription =
      'Look at your Pocket Graph below! The moment you searched the hall, FalkorDB executed graph reasoning queries in real time:\n\n• Red Contradiction (Q60): Dee claimed she was in the Lounge at 8:20, but the Hall keycard log proves she was in the corridor.\n• Green Clearance (Q63): Dr. Okoye was in the Conservatory—2 rooms away with zero connecting door path.\n\nDee is caught in an undeniable physical impossibility!';
    falkorDetail =
      'Q60 Contradiction Cypher: MATCH (s:Statement)-[:AT_TIME]->(t), (a:Anchor)-[:AT_TIME]->(t) WHERE s.room <> a.room RETURN clash';
    actionButtonLabel = 'Inspect Pocket Graph →';
    beaconTooltip = 'Review the red contradiction line and clearance shield on your Pocket Graph.';
  } else if (activeStep === 5) {
    targetSelector = '[data-accuse-button="true"]';
    stepTitle = 'Step 5: File Formal Accusation';
    stepSubtitle = 'Closing the Case with Graph Proof';
    modalDescription =
      'With mathematical graph certainty, Dee is the only person who cannot account for her whereabouts and is caught in a direct contradiction.\n\nClick the "Accuse" button in the top header and select Dee to file your indictment and close Case 0!';
    falkorDetail =
      'FalkorDB verdict verification: Un-eliminated suspects with unresolved contradictions match ground truth culprit with 100% precision.';
    actionButtonLabel = 'Take Me to Accuse →';
    beaconTooltip = 'Click Accuse to submit your verdict against Dee.';
  } else if (activeStep === 6) {
    stepTitle = '🎉 Case 0 Solved: Perfect Conviction!';
    stepSubtitle = 'Training Induction Complete';
    modalDescription =
      'Congratulations Detective! You have mastered the core mechanics of Alibi:\n\n1. Interrogate suspects to map statements into FalkorDB.\n2. Discover physical ground truth evidence.\n3. Let FalkorDB graph traversal detect contradictions and eliminate innocents.\n\nYou are now ready for Case 1: The Glass Alibi!';
    falkorDetail =
      'All graph reasoning ran against your local FalkorDB instance with zero LLM hallucinations.';
    actionButtonLabel = 'Proceed to Case 1 →';
    beaconTooltip = 'Case 0 solved successfully!';
  }

  const handleResetCase0 = async () => {
    setStep4Acknowledged(false);
    setShowCenterModal(true);
    await initCase('l1-quiet-pact', true);
  };

  return (
    <>
      {/* 1. Darkened Center Modal Step Dialog */}
      {showCenterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-surface-2 border-2 border-brass/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 relative">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brass/15 border border-brass/40">
                  <Compass className="size-3.5 text-brass" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brass">
                    {activeStep < 6 ? `Step ${activeStep} of 5 · Induction` : 'Complete'}
                  </span>
                </div>
                <span className="font-mono text-xs text-text-tertiary hidden sm:inline">
                  Case 0 Walkthrough
                </span>
              </div>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7 w-7 p-0 text-text-tertiary hover:text-text-primary"
                  title="Close Guide"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Step Header */}
            <div>
              <span className="font-mono text-xs text-brass uppercase tracking-wider block font-medium">
                {stepSubtitle}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-text-primary mt-1">
                {stepTitle}
              </h2>
            </div>

            {/* Narrative / Description */}
            <div className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {modalDescription}
            </div>

            {/* FalkorDB Superpower Explainer Box */}
            <div className="p-3 rounded-xl bg-surface-1 border border-border space-y-1">
              <div className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-brass" />
                <span className="font-mono text-xs font-semibold text-brass uppercase tracking-wider">
                  FalkorDB Live Graph
                </span>
              </div>
              <p className="font-mono text-xs text-text-tertiary leading-normal">
                {falkorDetail}
              </p>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCase0}
                className="text-xs text-text-tertiary hover:text-text-primary gap-1 px-2"
                title="Restart Case 0 from tick 0"
              >
                <RotateCcw className="size-3 text-brass" />
                <span>Replay Case 0</span>
              </Button>

              <div className="flex items-center gap-2">
                {activeStep === 6 ? (
                  <Link href="/play/case-1">
                    <Button variant="brass" size="default" className="text-xs gap-1.5 px-4">
                      <span>Start Case 1</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="brass"
                    size="default"
                    onClick={() => setShowCenterModal(false)}
                    className="text-xs gap-1.5 px-4 font-semibold shadow-md"
                  >
                    <span>{actionButtonLabel}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Slim Top Helper Pill when modal is closed */}
      {!showCenterModal && (
        <div className="w-full bg-surface-2 border-b-2 border-brass/60 px-4 py-2 shadow-card shrink-0 select-none animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brass/15 border border-brass/40 shrink-0">
                <Compass className="size-3 text-brass" />
                <span className="font-mono text-xs font-semibold text-brass">
                  Step {activeStep}/5
                </span>
              </div>
              <p className="text-xs font-medium text-text-primary truncate">
                {beaconTooltip}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {activeStep === 4 && (
                <Button
                  variant="brass"
                  size="sm"
                  onClick={() => {
                    setStep4Acknowledged(true);
                    setShowCenterModal(true);
                  }}
                  className="h-7 px-2.5 text-xs font-semibold gap-1"
                >
                  <span>Ready to Accuse Dee</span>
                  <ArrowRight className="size-3" />
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCenterModal(true)}
                className="h-7 px-2.5 text-xs text-text-primary gap-1"
              >
                <HelpCircle className="size-3 text-brass" />
                <span>Open Guide</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCase0}
                className="h-7 px-2 text-xs text-text-tertiary hover:text-text-primary"
                title="Replay Case 0 from start"
              >
                <RotateCcw className="size-3 text-brass" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Glowing Ring & Tooltip Beacon pointing to the target element */}
      {!showCenterModal && activeStep < 6 && !specimenMode && (
        <SpotlightBeacon
          targetSelector={targetSelector}
          message={beaconTooltip}
          onReopen={() => setShowCenterModal(true)}
          isStep4={activeStep === 4}
          onProceedStep4={() => {
            setStep4Acknowledged(true);
            setShowCenterModal(true);
          }}
        />
      )}
    </>
  );
}

// Subcomponent: SpotlightBeacon
function SpotlightBeacon({
  targetSelector,
  message,
  onReopen,
  isStep4,
  onProceedStep4,
}: {
  targetSelector: string;
  message: string;
  onReopen: () => void;
  isStep4?: boolean;
  onProceedStep4?: () => void;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    const interval = setInterval(updatePosition, 250);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(interval);
    };
  }, [targetSelector]);

  if (!rect) return null;

  // Calculate tooltip coordinates without overflow
  const isBottomClamped = rect.bottom + 70 > (typeof window !== 'undefined' ? window.innerHeight : 900);
  const tooltipTop = isBottomClamped
    ? Math.max(12, rect.top - 54)
    : Math.min((typeof window !== 'undefined' ? window.innerHeight : 900) - 80, rect.bottom + 10);
  const tooltipLeft = Math.min(
    (typeof window !== 'undefined' ? window.innerWidth : 1440) - 340,
    Math.max(16, rect.left)
  );

  return (
    <>
      {/* High-visibility glowing pulsing ring directly over the target element */}
      <div
        className="fixed pointer-events-none z-40 rounded-xl border-2 border-brass ring-4 ring-brass/60 shadow-lg animate-pulse transition-all duration-150"
        style={{
          top: Math.max(0, rect.top - 4),
          left: Math.max(0, rect.left - 4),
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      />

      {/* Floating Pointer Beacon Tooltip */}
      <div
        className="fixed z-50 pointer-events-auto bg-surface-3/95 backdrop-blur-sm border-2 border-brass rounded-xl p-3 shadow-xl text-text-primary text-xs flex items-center gap-2 max-w-sm animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
        }}
      >
        <span className="text-base select-none shrink-0 animate-bounce">👉</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs text-text-primary">{message}</p>
        </div>

        {isStep4 && onProceedStep4 && (
          <Button
            variant="brass"
            size="sm"
            onClick={onProceedStep4}
            className="h-6 px-2 text-xs font-semibold shrink-0"
          >
            Accuse Dee →
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onReopen}
          className="h-6 px-2 text-xs shrink-0"
        >
          Guide
        </Button>
      </div>
    </>
  );
}
