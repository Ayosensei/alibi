'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store';
import { RotateCcw, X, Loader2 } from 'lucide-react';

export function ResetModal() {
  const {
    caseData,
    caseId,
    isResetModalOpen,
    setResetModalOpen,
    resetCaseProgress,
  } = useGameStore();

  const [isResetting, setIsResetting] = React.useState(false);

  if (!isResetModalOpen) return null;

  const handleConfirm = async () => {
    setIsResetting(true);
    try {
      await resetCaseProgress(caseId);
      setResetModalOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
        className="relative w-full max-w-md rounded-xl bg-surface-1 border border-border shadow-floating p-6 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={isResetting}
            onClick={() => setResetModalOpen(false)}
            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-thread shrink-0">
            <RotateCcw className="size-5" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Restart Investigation
            </span>
            <h2 id="reset-modal-title" className="font-serif text-xl font-semibold text-text-primary">
              Reset {caseData?.title ?? 'Case'}?
            </h2>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          This will wipe your collected statements, search results, timeline entries, and board cards for this case. Your FalkorDB player graph will be reset to the beginning so you can solve it with a clean slate.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            disabled={isResetting}
            onClick={() => setResetModalOpen(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={isResetting}
            onClick={handleConfirm}
            className="text-xs gap-1.5"
          >
            {isResetting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Resetting Graph...
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                Restart Case
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
