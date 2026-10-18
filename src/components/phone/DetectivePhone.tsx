'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  Smartphone,
  PanelRight,
  PanelBottom,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  Target,
  Search,
  CheckCircle2,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface DetectivePhoneProps {
  mode?: 'docked' | 'panel';
  className?: string;
}

export function DetectivePhone({ mode = 'docked', className = '' }: DetectivePhoneProps) {
  const {
    caseData,
    board,
    contradictions,
    rehearsed,
    impossible,
    clearedSuspects,
    selectedSuspectId,
    selectSuspect,
    isPhoneDockedUnderInterrogation,
    setPhoneDockedUnderInterrogation,
    selectTab,
  } = useGameStore();

  const [isMinimized, setIsMinimized] = React.useState(false);

  if (!caseData) return null;

  const people = caseData.people;
  const nonVictims = people.filter((p) => !p.victim);
  const statements = board?.statements ?? [];
  const hardAnchors = board?.hardAnchors ?? [];

  // Active murder window
  const activeWindow = board?.window ?? caseData.publicWindow ?? [5];
  const murderSlot = activeWindow[0] ?? 5;
  const murderTime = caseData.slots[murderSlot - 1] ?? `Slot ${murderSlot}`;

  // Find suspects with contradictions
  const contradictedSuspectIds = new Set(contradictions.map((c) => c.subject));

  // Determine prime suspect: un-cleared suspect with contradictions or uneliminated
  const primeSuspect = nonVictims.find(
    (p) => !clearedSuspects[p.id] && (contradictedSuspectIds.has(p.id) || nonVictims.filter((s) => !clearedSuspects[s.id]).length === 1)
  );

  // Key rooms involved in statements or evidence
  const relevantRooms = caseData.rooms.filter((r) => {
    const hasStatement = statements.some((s) => s.room === r.id);
    const hasEvidence = hardAnchors.some((a) => a.room === r.id);
    const isCrimeScene = r.id === caseData.crimeScene;
    return hasStatement || hasEvidence || isCrimeScene;
  }).slice(0, 4);

  // If fewer than 4 relevant rooms, fill with other case rooms
  if (relevantRooms.length < 4) {
    for (const r of caseData.rooms) {
      if (relevantRooms.length >= 4) break;
      if (!relevantRooms.some((x) => x.id === r.id)) {
        relevantRooms.push(r);
      }
    }
  }

  // Layout coordinates for SVG canvas (viewBox 0 0 680 320)
  const leftX = 90;
  const rightX = 540;
  const suspectSpacing = 300 / Math.max(nonVictims.length, 1);
  const roomSpacing = 300 / Math.max(relevantRooms.length, 1);

  const suspectCoords = new Map<string, { x: number; y: number }>();
  nonVictims.forEach((p, idx) => {
    suspectCoords.set(p.id, { x: leftX, y: 35 + idx * suspectSpacing + suspectSpacing / 2 });
  });

  const roomCoords = new Map<string, { x: number; y: number }>();
  relevantRooms.forEach((r, idx) => {
    roomCoords.set(r.id, { x: rightX, y: 35 + idx * roomSpacing + roomSpacing / 2 });
  });

  // Ticker narrative message
  let tickerMessage = 'Blank state. Interrogate suspects to register alibi nodes on FalkorDB.';
  let tickerVariant: 'info' | 'thread' | 'success' | 'brass' = 'info';

  if (primeSuspect && statements.length >= 2) {
    tickerMessage = `Deduction Ready: ${primeSuspect.name} cannot be cleared (${contradictions.length} conflict detected). Target for accusation.`;
    tickerVariant = 'brass';
  } else if (contradictions.length > 0) {
    const firstConflict = contradictions[0];
    const culprit = nonVictims.find((p) => p.id === firstConflict.subject)?.name ?? firstConflict.subject;
    tickerMessage = `Contradiction Detected: ${culprit}'s claim clashes with evidence at ${firstConflict.roomA.replace(/_/g, ' ')}.`;
    tickerVariant = 'thread';
  } else if (impossible.length > 0) {
    tickerMessage = `Distance Impossibility: ${impossible[0].person} was too far from the crime scene, clearing their alibi.`;
    tickerVariant = 'success';
  } else if (statements.length > 0) {
    const latestStmt = statements[statements.length - 1];
    const speaker = nonVictims.find((p) => p.id === latestStmt.by)?.name ?? latestStmt.by;
    tickerMessage = `FalkorDB Node Registered: ${speaker} claimed ${latestStmt.room?.replace(/_/g, ' ')} at ${murderTime}.`;
    tickerVariant = 'info';
  }

  return (
    <div
      className={`flex flex-col bg-surface-2 border border-border-strong rounded-2xl shadow-card overflow-hidden transition-all duration-200 select-none ${
        mode === 'docked' ? 'border-t-2 border-t-brass/40' : ''
      } ${className}`}
    >
      {/* 1. Phone Top Status Bar & Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-3/90 border-b border-border text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-1 border border-border">
            <Smartphone className="size-3 text-brass" />
            <span className="font-mono text-xs font-semibold tracking-wider text-brass uppercase">
              Pocket Graph
            </span>
            <span className="size-1.5 rounded-full bg-status-cleared animate-pulse ml-0.5" />
          </div>
          <span className="hidden sm:inline font-mono text-xs text-text-tertiary">
            FalkorDB Live Link · {statements.length} claims · {contradictions.length} clashes
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {mode === 'docked' ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 px-2 text-xs text-text-secondary hover:text-text-primary"
                title={isMinimized ? 'Expand Phone' : 'Minimize Phone'}
              >
                {isMinimized ? <Maximize2 className="size-3 mr-1" /> : <Minimize2 className="size-3 mr-1" />}
                <span className="hidden md:inline">{isMinimized ? 'Expand' : 'Collapse'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhoneDockedUnderInterrogation(false);
                  selectTab('phone');
                }}
                className="h-7 px-2 text-xs text-text-secondary hover:text-text-primary gap-1"
                title="Collapse into Right Tabs Panel"
              >
                <PanelRight className="size-3 text-brass" />
                <span className="hidden sm:inline">Move to Tabs</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPhoneDockedUnderInterrogation(true);
                selectTab('timeline');
              }}
              className="h-7 px-2 text-xs text-text-secondary hover:text-text-primary gap-1"
              title="Dock Phone under Interrogation Room"
            >
              <PanelBottom className="size-3 text-brass" />
              <span>Dock under Interrogation</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Interactive Phone Screen Canvas */}
      {!isMinimized && (
        <div className="relative w-full bg-surface-1 overflow-hidden flex-1">
          <svg
            viewBox="0 0 680 320"
            className="w-full h-auto max-h-[300px] md:max-h-[340px] block"
          >
            {/* Background grid dots for graph terminal feel */}
            <defs>
              <pattern id="phone-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" className="fill-border-strong/40" />
              </pattern>
            </defs>
            <rect width="680" height="320" fill="url(#phone-dots)" />

            {/* EDGES: Alibi Statements (:CLAIMED) */}
            {statements.map((s, idx) => {
              const start = suspectCoords.get(s.by);
              const end = s.room ? roomCoords.get(s.room) : null;
              if (!start || !end) return null;

              const isContradicted = contradictions.some(
                (c) => c.subject === s.by && (c.roomA === s.room || c.roomB === s.room)
              );

              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              const curveY = midY + (idx % 2 === 0 ? -15 : 15);

              return (
                <g key={`stmt_edge_${s.id}_${idx}`}>
                  {/* Connection Path */}
                  <path
                    d={`M ${start.x} ${start.y} Q ${midX} ${curveY} ${end.x} ${end.y}`}
                    strokeWidth={1.5}
                    className={`fill-none transition-all duration-300 ${
                      isContradicted
                        ? 'stroke-thread stroke-2 animate-pulse'
                        : 'stroke-brass/70'
                    }`}
                  />
                  {/* Timestamp Label Badge on edge */}
                  <g transform={`translate(${midX}, ${curveY})`}>
                    <rect
                      x="-24"
                      y="-9"
                      width="48"
                      height="18"
                      rx="9"
                      className={`stroke text-center ${
                        isContradicted
                          ? 'fill-surface-3 stroke-thread'
                          : 'fill-surface-2 stroke-border'
                      }`}
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      className="font-mono text-xs fill-text-primary" // design-ok: SVG graph edge label
                    >
                      {s.slot ? `${caseData.slots[s.slot - 1] ?? `S${s.slot}`}` : 'Alibi'}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* EDGES: Red Contradiction Lightning Thread */}
            {contradictions.map((c, idx) => {
              const suspectPoint = suspectCoords.get(c.subject);
              const roomPointA = roomCoords.get(c.roomA);
              if (!suspectPoint || !roomPointA) return null;

              return (
                <g key={`contra_line_${idx}`}>
                  <line
                    x1={suspectPoint.x}
                    y1={suspectPoint.y}
                    x2={roomPointA.x}
                    y2={roomPointA.y}
                    strokeWidth={2}
                    className="stroke-thread animate-pulse"
                    strokeDasharray="6 3"
                  />
                  <g transform={`translate(${(suspectPoint.x + roomPointA.x) / 2}, ${(suspectPoint.y + roomPointA.y) / 2})`}>
                    <rect
                      x="-42"
                      y="-10"
                      width="84"
                      height="20"
                      rx="4"
                      className="fill-surface-3 stroke-thread stroke-1"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      className="font-mono text-xs font-bold fill-thread uppercase tracking-wider" // design-ok: SVG graph clash badge
                    >
                      CLASH (Q60)
                    </text>
                  </g>
                </g>
              );
            })}

            {/* NODES: Rooms (Right Column) */}
            {relevantRooms.map((room) => {
              const pt = roomCoords.get(room.id);
              if (!pt) return null;

              const isCrimeScene = room.id === caseData.crimeScene;
              const hasEvidenceInRoom = hardAnchors.some((a) => a.room === room.id);

              return (
                <g key={`room_node_${room.id}`} transform={`translate(${pt.x}, ${pt.y})`}>
                  {/* Room pill */}
                  <rect
                    x="-60"
                    y="-16"
                    width="120"
                    height="32"
                    rx="16"
                    className={`transition-colors duration-150 ${
                      isCrimeScene
                        ? 'fill-surface-2 stroke-thread stroke-1.5'
                        : hasEvidenceInRoom
                        ? 'fill-surface-2 stroke-brass stroke-1'
                        : 'fill-surface-1 stroke-border-strong stroke-1'
                    }`}
                  />
                  {/* Room Label */}
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    className="font-mono text-xs font-medium fill-text-primary capitalize select-none" // design-ok: SVG room label
                  >
                    {room.name.length > 15 ? `${room.name.slice(0, 14)}…` : room.name}
                  </text>
                  {/* Evidence tag */}
                  {hasEvidenceInRoom && (
                    <circle cx="50" cy="0" r="4" className="fill-brass animate-pulse" />
                  )}
                  {isCrimeScene && (
                    <circle cx="-50" cy="0" r="4" className="fill-thread" />
                  )}
                </g>
              );
            })}

            {/* NODES: Suspects (Left Column) */}
            {nonVictims.map((p) => {
              const pt = suspectCoords.get(p.id);
              if (!pt) return null;

              const isSelected = selectedSuspectId === p.id;
              const isCleared = clearedSuspects[p.id];
              const isContradicted = contradictedSuspectIds.has(p.id);
              const isPrime = primeSuspect?.id === p.id && statements.length >= 2;
              const hasStatements = statements.some((s) => s.by === p.id);

              const initials = p.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <g
                  key={`person_node_${p.id}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => selectSuspect(p.id)}
                  className="cursor-pointer group"
                >
                  {/* Prime Suspect Crosshair Aura */}
                  {isPrime && (
                    <circle
                      r="29"
                      className="fill-none stroke-thread stroke-2 animate-ping opacity-60"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    r="22"
                    strokeWidth={1.5}
                    className={`transition-all duration-200 ${
                      isContradicted
                        ? 'fill-surface-3 stroke-thread stroke-2 shadow-sm'
                        : isCleared
                        ? 'fill-surface-3 stroke-status-cleared stroke-2'
                        : isSelected
                        ? 'fill-surface-3 stroke-brass stroke-2 ring-2 ring-brass'
                        : hasStatements
                        ? 'fill-surface-2 stroke-brass/70'
                        : 'fill-surface-2 stroke-border group-hover:stroke-border-strong'
                    }`}
                  />

                  {/* Initials */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    className={`font-serif text-xs font-bold select-none ${
                      isContradicted
                        ? 'fill-thread'
                        : isCleared
                        ? 'fill-status-cleared'
                        : 'fill-text-primary'
                    }`}
                  >
                    {initials}
                  </text>

                  {/* Suspect Name label */}
                  <text
                    x="28"
                    y="3"
                    className="font-medium text-xs fill-text-primary group-hover:fill-brass transition-colors select-none" // design-ok: SVG suspect name
                  >
                    {p.name.split(' ')[0]}
                  </text>

                  {/* Deduction State Badge */}
                  {isCleared && (
                    <g transform="translate(14, -14)">
                      <circle r="7" className="fill-surface-3 stroke-status-cleared stroke-1" />
                      <text textAnchor="middle" dy="3" className="font-mono text-xs fill-status-cleared font-bold"> {/* design-ok: SVG badge check */}
                        ✓
                      </text>
                    </g>
                  )}
                  {isContradicted && (
                    <g transform="translate(14, -14)">
                      <circle r="7" className="fill-surface-3 stroke-thread stroke-1" />
                      <text textAnchor="middle" dy="3" className="font-mono text-xs fill-thread font-bold"> {/* design-ok: SVG badge conflict */}
                        !
                      </text>
                    </g>
                  )}
                  {isPrime && (
                    <g transform="translate(14, -14)">
                      <circle r="8" className="fill-thread stroke-surface-1 stroke-1" />
                      <text textAnchor="middle" dy="3" className="font-mono text-xs fill-surface-1 font-bold"> {/* design-ok: SVG badge prime */}
                        ⚡
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* 3. Real-Time Deduction Ticker */}
      <div className="px-3 py-2 bg-surface-3/90 border-t border-border flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="size-3.5 text-brass shrink-0" />
          <p
            className={`font-mono text-xs truncate ${
              tickerVariant === 'thread'
                ? 'text-thread font-medium'
                : tickerVariant === 'success'
                ? 'text-status-cleared font-medium'
                : tickerVariant === 'brass'
                ? 'text-brass font-semibold'
                : 'text-text-secondary'
            }`}
          >
            {tickerMessage}
          </p>
        </div>

        {primeSuspect && statements.length >= 2 && (
          <div className="shrink-0 ml-2">
            <span className="font-mono text-xs text-thread uppercase tracking-wider font-semibold">
              Target: {primeSuspect.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
