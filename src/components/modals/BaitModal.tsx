'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Stamp, Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { copy } from '@/lib/copy';
import type { UseBaitOutput } from '@/lib/api';
import { Sparkles, MessageSquare, AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

export function BaitModal() {
  const {
    caseData,
    board,
    usedBaitIds,
    isBaitModalOpen,
    setBaitModalOpen,
    useBaitAction,
    isLoading,
  } = useGameStore();

  const [selectedBaitId, setSelectedBaitId] = React.useState<string | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [lastBaitResult, setLastBaitResult] = React.useState<UseBaitOutput | null>(null);
  const [isDelivering, setIsDelivering] = React.useState(false);

  // Reset local state when modal closes
  const handleClose = () => {
    setBaitModalOpen(false);
    setSelectedBaitId(null);
    setIsConfirming(false);
    setLastBaitResult(null);
  };

  if (!isBaitModalOpen || !caseData) return null;

  const baitsAllowed = caseData.baitsAllowed ?? 0;
  const baitsLeft = board?.baitsLeft ?? Math.max(0, baitsAllowed - usedBaitIds.length);
  const availableBaits = caseData.baits ?? [];

  const handleSelectBait = (id: string) => {
    if (usedBaitIds.includes(id) || baitsLeft <= 0) return;
    setSelectedBaitId(id);
    setIsConfirming(true);
    setLastBaitResult(null);
  };

  const handleDeliverAnnouncement = async () => {
    if (!selectedBaitId) return;
    setIsDelivering(true);
    const res = await useBaitAction(selectedBaitId);
    setIsDelivering(false);
    if (res) {
      setLastBaitResult(res);
      setIsConfirming(false);
    }
  };

  const selectedBait = availableBaits.find((b) => b.id === selectedBaitId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bait-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-1 border border-border shadow-floating p-4 sm:p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200"
      >
        {/* Close icon */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
            aria-label="Close bait announcement modal"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="space-y-1.5 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brass" />
              <span className="font-mono text-xs uppercase tracking-widest text-brass">
                Psychological Gambit
              </span>
            </div>
            {baitsAllowed > 0 && (
              <Chip
                variant={baitsLeft > 0 ? 'brass' : 'thread'}
                className="text-xs font-mono"
              >
                {baitsLeft} of {baitsAllowed} left
              </Chip>
            )}
          </div>
          <h2
            id="bait-modal-title"
            className="font-serif text-2xl md:text-3xl font-semibold text-text-primary"
          >
            Bait <span className="italic font-normal text-brass">Announcement</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Make a prepared public statement to the gathered suspects to observe who slips under pressure.
          </p>
        </div>

        {/* Case with no baits allowed (Level 1) */}
        {baitsAllowed === 0 ? (
          <div className="p-6 rounded-lg bg-surface-2 border border-border text-center space-y-3">
            <AlertTriangle className="size-8 text-brass mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold text-text-primary">
                Gambit Unavailable
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Bait announcements are not authorized for this case file. Rely on physical contradictions, door logs, and witness statements.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Return to Dossier
            </Button>
          </div>
        ) : lastBaitResult ? (
          /* Result View after delivery */
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="size-4 text-brass" />
                <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                  Announcement Delivered
                </span>
              </div>
              {lastBaitResult.outcome === 'slip' && (
                <Stamp status="slip" label="SLIP DETECTED" />
              )}
              {lastBaitResult.outcome === 'ambiguous' && (
                <Stamp status="rehearsed" label="AMBIGUOUS" />
              )}
              {lastBaitResult.outcome === 'nothing' && (
                <Stamp status="custom" label="NO REACTION" />
              )}
            </div>

            {/* Outcome description banner */}
            {lastBaitResult.outcome === 'slip' && (
              <div className="p-4 rounded-lg bg-status-contradiction/10 border border-status-contradiction/30 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-status-contradiction" />
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-status-contradiction">
                    Critical Slip of the Tongue
                  </span>
                </div>
                <p className="text-xs text-text-primary">
                  The suspect revealed private knowledge of the crime scene that only someone present could have known. A new statement card has been placed on the evidence board.
                </p>
              </div>
            )}

            {lastBaitResult.outcome === 'ambiguous' && (
              <div className="p-4 rounded-lg bg-surface-2 border border-border space-y-1.5">
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary block">
                  Inconclusive Reaction
                </span>
                <p className="text-xs text-text-primary">
                  {copy.baitAmbiguous}
                </p>
              </div>
            )}

            {lastBaitResult.outcome === 'nothing' && (
              <div className="p-4 rounded-lg bg-surface-2 border border-border text-center">
                <p className="text-xs text-text-secondary">
                  Nobody reacted to the statement. The suspects maintained silence.
                </p>
              </div>
            )}

            {/* Suspect reactions */}
            {lastBaitResult.reactions.length > 0 && (
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Witness Observations
                </span>
                <div className="space-y-2.5">
                  {lastBaitResult.reactions.map((react, idx) => {
                    const person = caseData.people.find((p) => p.id === react.person);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-surface-2 border border-border space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-3 text-brass">
                            {person?.name ?? react.person}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {person?.role}
                          </span>
                        </div>
                        <p className="text-sm font-serif italic text-text-primary pl-2 border-l-2 border-brass/50">
                          &ldquo;{react.text}&rdquo;
                        </p>
                        {react.observation && (
                          <p className="text-xs italic text-text-secondary pl-2">
                            * {react.observation} *
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="default" size="sm" onClick={handleClose}>
                Return to Investigation
              </Button>
            </div>
          </div>
        ) : isConfirming && selectedBait ? (
          /* Confirmation Step */
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-lg bg-surface-2 border border-brass/40 space-y-3">
              <div className="flex items-center gap-2 text-brass">
                <AlertTriangle className="size-4 shrink-0" />
                <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                  Confirm Prepared Announcement
                </span>
              </div>
              <p className="text-sm font-serif italic text-text-primary bg-surface-1 p-3.5 rounded border border-border">
                &ldquo;{selectedBait.announcement}&rdquo;
              </p>
              <p className="text-xs text-thread font-mono">
                {copy.baitConfirm(baitsLeft)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={isDelivering}
                onClick={() => setIsConfirming(false)}
              >
                Back to Selection
              </Button>
              <Button
                variant="brass"
                size="sm"
                disabled={isDelivering}
                onClick={handleDeliverAnnouncement}
              >
                {isDelivering ? 'Delivering...' : 'Deliver Announcement'}
              </Button>
            </div>
          </div>
        ) : (
          /* List of Prepared Announcements */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Select one statement to announce:</span>
              <span className="font-mono text-brass">
                {baitsLeft} {baitsLeft === 1 ? 'attempt' : 'attempts'} remaining
              </span>
            </div>

            {availableBaits.length === 0 ? (
              <p className="text-xs text-text-secondary italic">
                No announcements prepared for this case file.
              </p>
            ) : (
              <div className="space-y-3">
                {availableBaits.map((bait, idx) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C...
                  const isUsed = usedBaitIds.includes(bait.id);
                  const isDisabled = isUsed || baitsLeft <= 0 || isLoading;

                  return (
                    <div
                      key={bait.id}
                      onClick={() => !isDisabled && handleSelectBait(bait.id)}
                      className={`p-4 rounded-lg border transition-all select-none ${
                        isUsed
                          ? 'bg-surface-2/60 border-border opacity-60 cursor-not-allowed'
                          : isDisabled
                          ? 'bg-surface-2/40 border-border opacity-50 cursor-not-allowed'
                          : 'bg-surface-2 border-border hover:border-brass/70 cursor-pointer shadow-card hover:shadow-floating'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-mono text-xs font-semibold tracking-wider text-brass uppercase">
                          ANNOUNCEMENT {letter}
                        </span>
                        {isUsed && (
                          <Chip variant="default" className="text-xs">
                            <Check className="size-3 mr-1 text-status-cleared" />
                            Announced
                          </Chip>
                        )}
                      </div>
                      <p className="font-mono text-xs text-text-primary leading-relaxed">
                        &ldquo;{bait.announcement}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {baitsLeft <= 0 && (
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-center">
                <p className="text-xs text-thread font-mono">
                  You have exhausted your bait announcements for this case.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
