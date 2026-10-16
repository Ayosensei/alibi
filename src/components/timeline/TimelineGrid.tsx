'use client';

import * as React from 'react';
import { useGameStore } from '@/lib/store';
import { Stamp, Chip, EmptyState } from '@/components/atoms';
import {
  Feather,
  Pin,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Clock,
  MapPin,
  Skull,
} from 'lucide-react';

interface CellLocationItem {
  id: string;
  kind: 'statement' | 'evidence' | 'inferred';
  room: string;
  label?: string;
  text?: string;
  speaker?: string;
}

export function TimelineGrid() {
  const {
    caseData,
    board,
    contradictions,
    rehearsed,
    impossible,
    clearedSuspects,
    highlights,
    setFocusedCell,
    selectTab,
  } = useGameStore();

  const [hoveredCell, setHoveredCell] = React.useState<{ person: string; slot: number } | null>(null);

  if (!caseData) return null;

  const slots = caseData.slots; // 8 time slots
  const activeWindow = board?.window ?? caseData.publicWindow ?? [4, 5];
  const people = caseData.people;

  // Extract all soft assertions from statements
  const statements = board?.statements ?? [];
  // Extract all hard anchors from evidence
  const hardAnchors = board?.hardAnchors ?? [];

  // Helper to get room display name
  const getRoomName = (roomId: string) => {
    const found = caseData.rooms.find((r) => r.id === roomId);
    return found ? found.name : roomId.replace(/_/g, ' ');
  };

  // Helper to get location items for a person at a slot
  const getCellItems = (personId: string, slotNum: number): CellLocationItem[] => {
    const items: CellLocationItem[] = [];

    // 1. Statements
    for (const s of statements) {
      const subjectMatch = s.subject ? s.subject === personId : s.by === personId;
      if (subjectMatch && s.slot === slotNum && s.room) {
        items.push({
          id: s.id,
          kind: 'statement',
          room: s.room,
          label: s.by === personId ? 'Claimed' : `Seen by ${s.by}`,
          text: s.text,
          speaker: s.by,
        });
      }
    }

    // 2. Hard Evidence Anchors
    for (const a of hardAnchors) {
      if (a.subject === personId && a.slot === slotNum) {
        const isInferred = a.src.startsWith('inferred:');
        items.push({
          id: a.src,
          kind: isInferred ? 'inferred' : 'evidence',
          room: a.room,
          label: isInferred ? 'Deductive Anchor' : a.src.toUpperCase(),
        });
      }
    }

    return items;
  };

  // Check if cell has contradiction
  const getCellContradiction = (personId: string, slotNum: number) => {
    return contradictions.find((c) => c.subject === personId && c.slot === slotNum);
  };

  // Check if cell is in a rehearsed alibi group
  const getCellRehearsed = (personId: string, slotNum: number) => {
    return rehearsed.find((g) => g.slot === slotNum && g.people.includes(personId));
  };

  // Check if person has an impossible move involving this slot
  const getPersonImpossibleMoves = (personId: string) => {
    return impossible.filter((m) => m.person === personId);
  };

  const hasAnyData = statements.length > 0 || hardAnchors.length > 0;

  if (!hasAnyData) {
    return (
      <div className="p-8 rounded-xl bg-surface-2 border border-border">
        <EmptyState
          titlePrefix="Ask someone where they "
          titleItalic="were"
          titleSuffix="."
          description="The timeline populates as suspects state their whereabouts and physical proof is discovered."
          icon={<Clock className="size-6 text-text-tertiary" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 select-text">
      {/* Table legend & controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-text-tertiary uppercase">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper text-ink border border-ink/20 shadow-xs font-mono text-xs">
              <Feather className="size-2.5" />
              Spoken Claim
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-text-primary border border-border shadow-xs font-mono text-xs">
              <Pin className="size-2.5 text-brass" />
              Physical Proof
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-inspector/10 text-inspector border border-dashed border-inspector/50 font-mono text-xs">
              <Sparkles className="size-2.5 text-inspector" />
              Elimination
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-thread" />
            <span className="text-text-secondary text-xs">Contradiction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brass" />
            <span className="text-text-secondary text-xs">Murder Window</span>
          </div>
        </div>
      </div>

      {/* Main Timeline Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-card">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2/80">
              <th scope="col" className="p-3 font-mono uppercase text-text-tertiary font-semibold sticky left-0 z-20 bg-surface-2 min-w-[140px] md:min-w-[160px] border-r border-border">
                Subject
              </th>
              {slots.map((timeStr, idx) => {
                const slotNum = idx + 1;
                const isWindow = activeWindow.includes(slotNum);
                return (
                  <th
                    key={slotNum}
                    scope="col"
                    className={`p-2.5 text-center font-mono font-medium min-w-[110px] md:min-w-[125px] border-r border-border last:border-r-0 transition-colors ${
                      isWindow ? 'bg-brass/10 text-brass' : 'text-text-secondary'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-xs">{timeStr}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-text-tertiary">S{slotNum}</span>
                        {isWindow && (
                          <span className="size-1.5 rounded-full bg-brass shrink-0" title="Murder Window Slot" />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
              <th scope="col" className="p-3 text-center font-mono uppercase text-text-tertiary font-semibold min-w-[100px]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {people.map((person) => {
              const isCleared = clearedSuspects[person.id] === true;
              const personMoves = getPersonImpossibleMoves(person.id);

              return (
                <tr
                  key={person.id}
                  className={`group transition-colors ${
                    person.victim ? 'bg-surface-2/40' : 'hover:bg-surface-2/30'
                  }`}
                >
                  {/* Person Row Header */}
                  <th
                    scope="row"
                    className="p-3 sticky left-0 z-10 bg-surface-1 group-hover:bg-surface-2/70 border-r border-border min-w-[140px] md:min-w-[160px] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-7 rounded-full flex items-center justify-center font-serif font-bold text-xs shrink-0 border ${
                          person.victim
                            ? 'bg-thread/20 text-thread border-thread/40'
                            : 'bg-surface-3 text-text-primary border-border'
                        }`}
                      >
                        {person.victim ? <Skull className="size-3.5" /> : person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-serif font-semibold text-text-primary block truncate">
                          {person.name}
                        </span>
                        <span className="font-mono text-xs text-text-tertiary block truncate">
                          {person.victim ? 'Victim' : person.role}
                        </span>
                      </div>
                    </div>
                  </th>

                  {/* 8 Slot Cells */}
                  {slots.map((_, idx) => {
                    const slotNum = idx + 1;
                    const isWindow = activeWindow.includes(slotNum);
                    const items = getCellItems(person.id, slotNum);
                    const contradiction = getCellContradiction(person.id, slotNum);
                    const rehearsedGroup = getCellRehearsed(person.id, slotNum);

                    const isCellFocused =
                      highlights.focusedCell?.person === person.id &&
                      highlights.focusedCell?.slot === slotNum;

                    return (
                      <td
                        key={slotNum}
                        onClick={() => {
                          setFocusedCell({ person: person.id, slot: slotNum });
                        }}
                        onMouseEnter={() => setHoveredCell({ person: person.id, slot: slotNum })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`p-1.5 relative border-r border-border last:border-r-0 align-top transition-all cursor-pointer ${
                          isWindow ? 'bg-brass/5' : ''
                        } ${
                          contradiction
                            ? 'ring-2 ring-thread/90 ring-inset bg-thread/10'
                            : ''
                        } ${
                          isCellFocused ? 'ring-2 ring-primary ring-inset' : ''
                        }`}
                      >
                        {/* Contradiction Stamp & Hover Banner */}
                        {contradiction && (
                          <div className="mb-1">
                            <Stamp status="contradiction" label="CONTRADICTION" />
                          </div>
                        )}

                        {/* Rehearsed bracket flag */}
                        {rehearsedGroup && (
                          <div className="mb-1 border-l-2 border-brass pl-1 py-0.5 bg-brass/10 rounded-r">
                            <span className="font-mono text-xs text-brass uppercase font-semibold block">
                              Rehearsed
                            </span>
                            <span className="text-xs text-text-secondary italic block line-clamp-1">
                              "{rehearsedGroup.detail}"
                            </span>
                          </div>
                        )}

                        {/* Cell pills */}
                        <div className="space-y-1">
                          {items.map((item, itemIdx) => {
                            if (item.kind === 'statement') {
                              return (
                                <div
                                  key={itemIdx}
                                  title={item.text ?? item.room}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper text-ink border border-ink/20 shadow-xs font-mono text-xs max-w-full truncate"
                                >
                                  <Feather className="size-2.5 shrink-0 text-ink/70" />
                                  <span className="truncate">{getRoomName(item.room)}</span>
                                </div>
                              );
                            }

                            if (item.kind === 'inferred') {
                              return (
                                <div
                                  key={itemIdx}
                                  title={`Inferred single survivor placement at ${getRoomName(item.room)}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-inspector/15 text-inspector border border-dashed border-inspector/60 font-mono text-xs max-w-full truncate"
                                >
                                  <Sparkles className="size-2.5 shrink-0 text-inspector" />
                                  <span className="truncate">{getRoomName(item.room)}</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={itemIdx}
                                title={`Physical evidence placement at ${getRoomName(item.room)}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-text-primary border border-border shadow-xs font-mono text-xs max-w-full truncate"
                              >
                                <Pin className="size-2.5 shrink-0 text-brass" />
                                <span className="truncate">{getRoomName(item.room)}</span>
                              </div>
                            );
                          })}

                          {items.length === 0 && (
                            <span className="text-xs text-text-tertiary/40 block py-1 text-center font-mono">
                              —
                            </span>
                          )}
                        </div>

                        {/* Tooltip on cell hover with conflict details */}
                        {hoveredCell?.person === person.id &&
                          hoveredCell?.slot === slotNum &&
                          contradiction && (
                            <div className="absolute top-full left-0 z-30 mt-1 w-64 p-2.5 rounded-lg bg-surface-3 border border-thread/60 shadow-floating text-xs space-y-1.5 animate-in fade-in duration-150">
                              <div className="flex items-center gap-1.5 text-thread font-mono font-semibold text-xs">
                                <AlertTriangle className="size-3" />
                                Conflict Sources
                              </div>
                              <div className="space-y-1 text-text-primary">
                                <div className="p-1 rounded bg-surface-2 text-xs">
                                  <span className="font-mono text-thread block">
                                    Claim A: {getRoomName(contradiction.roomA)}
                                  </span>
                                  <span className="text-text-secondary text-xs">
                                    {contradiction.a.text ?? contradiction.a.src}
                                  </span>
                                </div>
                                <div className="p-1 rounded bg-surface-2 text-xs">
                                  <span className="font-mono text-thread block">
                                    Claim B: {getRoomName(contradiction.roomB)}
                                  </span>
                                  <span className="text-text-secondary text-xs">
                                    {contradiction.b.text ?? contradiction.b.src}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                      </td>
                    );
                  })}

                  {/* Status Column (Cleared vs Unclear) */}
                  <td className="p-3 text-center align-middle whitespace-nowrap min-w-[100px]">
                    {person.victim ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-thread/10 text-thread border border-thread/30">
                        Victim
                      </span>
                    ) : isCleared ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-success/15 text-status-cleared border border-status-cleared/30 shadow-xs">
                        <CheckCircle className="size-3 text-status-cleared" />
                        Cleared
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-3 text-text-tertiary border border-border">
                        <HelpCircle className="size-3" />
                        Unclear
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Impossible moves banner if any detected */}
      {impossible.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface-2 border border-status-impossible/40 space-y-2">
          <div className="flex items-center gap-2 text-status-impossible text-xs font-mono uppercase font-semibold">
            <AlertTriangle className="size-3.5 text-status-impossible" />
            <span>Impossible Journeys Detected ({impossible.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {impossible.map((mv, i) => {
              const p = people.find((x) => x.id === mv.person);
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-surface-3 border border-status-impossible/20 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary capitalize">
                      {p?.name ?? mv.person}
                    </span>
                    <span className="font-mono text-status-impossible text-xs font-medium">
                      Too far: {mv.needed} doors away · Only {mv.available} {mv.available === 1 ? 'slot' : 'slots'} apart
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs">
                    Journey requires {mv.needed} room transitions: {mv.path.map(getRoomName).join(' → ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
