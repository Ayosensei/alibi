'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Stamp, Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { copy } from '@/lib/copy';
import type { AccuseOutput } from '@/lib/api';
import {
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';

export function AccuseModal() {
  const router = useRouter();
  const {
    caseId,
    caseData,
    isAccuseModalOpen,
    setAccuseModalOpen,
    prefilledAccused,
    accuseSuspectsAction,
    lastVerdict,
  } = useGameStore();

  const [selectedPersons, setSelectedPersons] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [outcome, setOutcome] = React.useState<AccuseOutput | null>(null);

  // Sync pre-filled accused persons when modal opens
  React.useEffect(() => {
    if (isAccuseModalOpen) {
      if (prefilledAccused.length > 0) {
        setSelectedPersons(prefilledAccused);
      }
      setOutcome(null);
    }
  }, [isAccuseModalOpen, prefilledAccused]);

  if (!isAccuseModalOpen || !caseData) return null;

  const suspects = caseData.people.filter((p) => !p.victim);
  const wrongLeft = outcome?.wrongLeft ?? 2; // Default 2 wrong attempts before game over

  const handleTogglePerson = (id: string) => {
    if (selectedPersons.includes(id)) {
      setSelectedPersons(selectedPersons.filter((p) => p !== id));
    } else {
      if (selectedPersons.length >= 4) return;
      setSelectedPersons([...selectedPersons, id]);
    }
  };

  const handleClose = () => {
    setAccuseModalOpen(false);
    setOutcome(null);
  };

  const handleSubmitAccusation = async () => {
    if (selectedPersons.length === 0 || selectedPersons.length > 4) return;
    setIsSubmitting(true);
    const res = await accuseSuspectsAction(selectedPersons);
    setIsSubmitting(false);

    if (res) {
      setOutcome(res);
      if (res.result === 'full') {
        // Successful solve: navigate to verdict after a moment or via button
        router.push(`/play/${caseId}/verdict`);
      }
    }
  };

  const handleGoToVerdict = () => {
    handleClose();
    router.push(`/play/${caseId}/verdict`);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="accuse-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-1 border border-border shadow-floating p-4 sm:p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
            aria-label="Close accuse modal"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="space-y-1.5 border-b border-border pb-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-thread" />
              <span className="font-mono text-xs uppercase tracking-widest text-thread">
                Formal Indictment
              </span>
            </div>
            <span className="font-mono text-xs text-text-secondary">
              {copy.accuseConfirm(wrongLeft)}
            </span>
          </div>
          <h2
            id="accuse-modal-title"
            className="font-serif text-2xl md:text-3xl font-semibold text-text-primary"
          >
            Deliver <span className="italic font-normal text-thread">Accusation</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Name the person or persons responsible for the crime. A false accusation costs a life.
          </p>
        </div>

        {/* Outcome States */}
        {outcome ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            {outcome.result === 'full' ? (
              <div className="p-6 rounded-lg bg-surface-2 border border-brass/50 text-center space-y-4">
                <Stamp status="cleared" label="CASE CLOSED" className="text-sm px-3 py-1" />
                <div className="space-y-1.5">
                  <h3 className="font-serif text-xl font-semibold text-text-primary">
                    Accusation Confirmed
                  </h3>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    {copy.closed} Your reasoning holds. The true conspirators have been identified.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleGoToVerdict}
                  className="mx-auto"
                >
                  Proceed to Case Verdict
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            ) : outcome.result === 'partial' ? (
              <div className="p-6 rounded-lg bg-surface-2 border border-status-impossible/40 space-y-4">
                <div className="flex items-center justify-between">
                  <Stamp status="impossible" label="PARTIAL ACCUSATION" />
                  <span className="font-mono text-xs text-thread font-medium">
                    {outcome.wrongLeft} {outcome.wrongLeft === 1 ? 'life' : 'lives'} left
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-semibold text-text-primary">
                    {copy.partial}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    You have identified a participant, but the conspiracy is wider. The mastermind or co-conspirator remains unnamed on your warrant.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutcome(null)}
                  >
                    Adjust Names
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClose}
                  >
                    Return to Board
                  </Button>
                </div>
              </div>
            ) : (
              /* Wrong outcome */
              <div className="p-6 rounded-lg bg-surface-2 border border-thread/40 space-y-4">
                <div className="flex items-center justify-between">
                  <Stamp status="contradiction" label="NOT QUITE" />
                  <span className="font-mono text-xs text-thread font-medium">
                    {outcome.wrongLeft} {outcome.wrongLeft === 1 ? 'life' : 'lives'} left
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-semibold text-text-primary">
                    {copy.wrong}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    The evidence on your board does not support this indictment. An innocent person was named, or an alibi was overlooked.
                  </p>
                </div>

                {outcome.levelOver ? (
                  <div className="pt-2 space-y-3">
                    <p className="text-xs text-thread font-mono">
                      All formal accusations have been exhausted. The case file is closed.
                    </p>
                    <Button
                      variant="default"
                      size="default"
                      onClick={handleGoToVerdict}
                      className="w-full"
                    >
                      View Case Summary & Replay
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOutcome(null)}
                    >
                      Try Another Combination
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClose}
                    >
                      Review Evidence
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Selection View */
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Select 1 to 4 suspects:</span>
              <span className="font-mono">
                {selectedPersons.length} of 4 selected
              </span>
            </div>

            {/* Suspect Multi-Select Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suspects.map((suspect) => {
                const isSelected = selectedPersons.includes(suspect.id);
                const initials = suspect.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={suspect.id}
                    onClick={() => handleTogglePerson(suspect.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-surface-3 border-thread shadow-thread-glow'
                        : 'bg-surface-2 border-border hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`relative size-9 rounded-full overflow-hidden shrink-0 ring-1 ${
                          isSelected
                            ? 'ring-thread ring-offset-1 ring-offset-surface-3'
                            : 'ring-border'
                        }`}
                      >
                        <Image
                          src={`/avatars/${suspect.id}.svg`}
                          alt={suspect.name}
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-xs text-text-primary block truncate">
                          {suspect.name}
                        </span>
                        <span className="text-xs text-text-secondary block truncate">
                          {suspect.role}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`size-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-thread border-thread text-on-primary'
                          : 'border-border bg-surface-1'
                      }`}
                    >
                      {isSelected && <Check className="size-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Accusation warning */}
            <div className="p-3.5 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-brass shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-mono text-xs text-brass uppercase tracking-wide block">
                  Consequences of Indictment
                </span>
                <p>
                  You have <span className="text-thread font-mono font-medium">{wrongLeft}</span> accusation attempts remaining. Selecting the exact group of conspirators closes the case.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="default"
                disabled={selectedPersons.length === 0 || selectedPersons.length > 4 || isSubmitting}
                onClick={handleSubmitAccusation}
              >
                <ShieldAlert className="size-4 mr-2" />
                {isSubmitting ? 'Submitting Indictment...' : 'Deliver Accusation'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
