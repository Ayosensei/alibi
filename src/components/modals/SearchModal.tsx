'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Polaroid, Stamp, Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { copy } from '@/lib/copy';
import { Search, MapPin, Clock, DoorOpen, X, Check } from 'lucide-react';

export function SearchModal() {
  const {
    caseData,
    isSearchModalOpen,
    setSearchModalOpen,
    activeSearchRoomId,
    lastSearchResults,
  } = useGameStore();

  if (!isSearchModalOpen || !lastSearchResults) return null;

  const room = caseData?.rooms.find((r) => r.id === activeSearchRoomId);
  const roomName = room?.name ?? activeSearchRoomId ?? 'Room';

  const windowText = lastSearchResults.windowChanged
    ? lastSearchResults.windowChanged
        .map((s) => caseData?.slots[s - 1] ?? `Slot ${s}`)
        .join(' – ')
    : null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setSearchModalOpen(false); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-surface-1 border border-border shadow-floating p-4 sm:p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200"
      >
        {/* Close icon */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchModalOpen(false)}
            className="size-8 p-0 text-text-tertiary hover:text-text-primary"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="space-y-1.5 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-brass" />
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Scene Investigation
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">
            Search: <span className="italic font-normal text-thread">{roomName}</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Physical examination report and recovered exhibits from {roomName}.
          </p>
        </div>

        {/* Discoveries and Stamps */}
        <div className="space-y-3">
          {/* Passage revealed notice */}
          {lastSearchResults.revealedEdge && (
            <div className="p-3.5 rounded-lg bg-surface-2 border border-brass/50 flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <DoorOpen className="size-5 text-brass shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-brass block">
                    Hidden Corridor Discovered
                  </span>
                  <p className="text-xs text-text-secondary">
                    {copy.passageFound}
                  </p>
                </div>
              </div>
              <Stamp status="rehearsed" label="PASSAGE FOUND" />
            </div>
          )}

          {/* Murder window revised notice */}
          {lastSearchResults.windowChanged && windowText && (
            <div className="p-3.5 rounded-lg bg-surface-2 border border-thread/50 flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <Clock className="size-5 text-thread shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-thread block">
                    Murder Window Revised
                  </span>
                  <p className="text-xs text-text-secondary">
                    {copy.windowRevised(windowText)}
                  </p>
                </div>
              </div>
              <Stamp status="contradiction" label="WINDOW REVISED" />
            </div>
          )}

          {/* Inferred person presence notice */}
          {lastSearchResults.inferred.length > 0 && (
            <div className="p-3.5 rounded-lg bg-surface-2 border border-inspector/50 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-inspector uppercase">
                  Deductive Anchor Inferred
                </span>
                <Stamp status="inferred" label="INFERRED" />
              </div>
              {lastSearchResults.inferred.map((inf, i) => (
                <p key={i} className="text-xs text-text-primary capitalize">
                  Physical trace places <strong className="text-inspector">{inf.person}</strong> in{' '}
                  <strong className="text-text-primary">{inf.room.replace(/_/g, ' ')}</strong> at Slot {inf.slot}.
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Found Exhibits */}
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary block">
            Exhibits Discovered ({lastSearchResults.found.length})
          </span>

          {lastSearchResults.found.length === 0 ? (
            <div className="p-6 rounded-lg bg-surface-2 border border-border text-center text-text-tertiary text-xs">
              You thoroughly searched {roomName}. No physical items or traces were found.
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 items-start justify-center md:justify-start pt-2">
              {lastSearchResults.found.map((item, idx) => (
                <Polaroid
                  key={item.id}
                  id={item.id}
                  kind="evidence"
                  label={`EXHIBIT ${String.fromCharCode(65 + idx)}`}
                  title={item.title}
                  text={item.text}
                  source={`Found in ${roomName}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-border">
          <Button
            variant="default"
            size="default"
            onClick={() => setSearchModalOpen(false)}
            className="w-full justify-center"
          >
            <Check className="size-4 mr-2" />
            File Exhibits to Case Board
          </Button>
        </div>
      </div>
    </div>
  );
}
