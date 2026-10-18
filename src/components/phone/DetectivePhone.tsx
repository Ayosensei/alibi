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
  X,
  Database,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface DetectivePhoneProps {
  mode?: 'docked' | 'panel';
  className?: string;
}

interface InspectedEntity {
  type: 'suspect' | 'room' | 'conflict' | 'clearance';
  id: string;
  name: string;
  roleOrType: string;
  status: string;
  statusVariant: 'thread' | 'success' | 'brass' | 'info';
  humanSummary: string;
  cypherProof: string;
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
  const [inspectedEntity, setInspectedEntity] = React.useState<InspectedEntity | null>(null);
  const [showCypherProof, setShowCypherProof] = React.useState(false);

  if (!caseData) return null;

  const people = caseData.people;
  const nonVictims = people.filter((p) => !p.victim);
  const statements = board?.statements ?? [];
  const hardAnchors = board?.hardAnchors ?? [];

  // Active murder window
  const activeWindow = board?.window ?? caseData.publicWindow ?? [5];
  const murderSlot = activeWindow[0] ?? 5;
  const murderTime = caseData.slots[murderSlot - 1] ?? `Slot ${murderSlot}`;

  // Contradicted suspects
  const contradictedSuspectIds = new Set(contradictions.map((c) => c.subject));

  // Determine prime suspect
  const primeSuspect = nonVictims.find(
    (p) => !clearedSuspects[p.id] && (contradictedSuspectIds.has(p.id) || nonVictims.filter((s) => !clearedSuspects[s.id]).length === 1)
  );

  // Relevant rooms: prioritize rooms with statements or evidence or crime scene
  const relevantRooms = caseData.rooms.filter((r) => {
    const hasStatement = statements.some((s) => s.room === r.id);
    const hasEvidence = hardAnchors.some((a) => a.room === r.id);
    const isCrimeScene = r.id === caseData.crimeScene;
    return hasStatement || hasEvidence || isCrimeScene;
  }).slice(0, 4);

  if (relevantRooms.length < 4) {
    for (const r of caseData.rooms) {
      if (relevantRooms.length >= 4) break;
      if (!relevantRooms.some((x) => x.id === r.id)) {
        relevantRooms.push(r);
      }
    }
  }

  // Layout coordinates for SVG canvas (viewBox 0 0 680 320)
  const leftX = 95;
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
  let tickerMessage = 'Blank state. Interrogate suspects or search rooms to grow your FalkorDB knowledge graph.';
  let tickerVariant: 'info' | 'thread' | 'success' | 'brass' = 'info';

  if (primeSuspect && statements.length >= 2) {
    tickerMessage = `Deduction Ready: ${primeSuspect.name} cannot be cleared (${contradictions.length} contradiction detected). Target for accusation!`;
    tickerVariant = 'brass';
  } else if (contradictions.length > 0) {
    const firstConflict = contradictions[0];
    const culprit = nonVictims.find((p) => p.id === firstConflict.subject)?.name ?? firstConflict.subject;
    tickerMessage = `Contradiction Caught: ${culprit}'s alibi clashes with physical evidence at ${firstConflict.roomA.replace(/_/g, ' ')}.`;
    tickerVariant = 'thread';
  } else if (impossible.length > 0) {
    tickerMessage = `Distance Clearance: ${impossible[0].person} was too far from the crime scene, proving innocence.`;
    tickerVariant = 'success';
  } else if (statements.length > 0) {
    const latestStmt = statements[statements.length - 1];
    const speaker = nonVictims.find((p) => p.id === latestStmt.by)?.name ?? latestStmt.by;
    tickerMessage = `FalkorDB Node Registered: ${speaker} claimed ${latestStmt.room?.replace(/_/g, ' ')} at ${murderTime}.`;
    tickerVariant = 'info';
  }

  // Handlers for inspecting elements on click
  const handleInspectSuspect = (suspectId: string) => {
    selectSuspect(suspectId);
    const p = nonVictims.find((x) => x.id === suspectId);
    if (!p) return;

    const isContr = contradictedSuspectIds.has(suspectId);
    const isClr = clearedSuspects[suspectId];
    const pStmts = statements.filter((s) => s.by === suspectId);
    const stmtRoom = pStmts[0]?.room
      ? caseData.rooms.find((r) => r.id === pStmts[0].room)?.name ?? pStmts[0].room
      : null;

    setInspectedEntity({
      type: 'suspect',
      id: suspectId,
      name: p.name,
      roleOrType: p.role,
      status: isContr
        ? '⚠️ Contradiction Detected'
        : isClr
        ? '🛡️ Cleared by Distance'
        : pStmts.length > 0
        ? '💬 Alibi Claimed'
        : '⚪ Blank Initial State',
      statusVariant: isContr ? 'thread' : isClr ? 'success' : pStmts.length > 0 ? 'brass' : 'info',
      humanSummary: isContr
        ? `${p.name} claimed she was in the ${stmtRoom ?? 'another room'} at ${murderTime}, but physical evidence proves she was in the Hallway. She cannot be in two places at once.`
        : isClr
        ? `${p.name} was in the ${stmtRoom ?? 'another room'}. The estate layout proves it is physically impossible to reach the murder room in zero minutes.`
        : pStmts.length > 0
        ? `${p.name} claimed alibi: in ${stmtRoom ?? 'estate'} at ${murderTime}.`
        : `${p.name} has not made any statements yet. Interrogate her in the center panel to register her alibi.`,
      cypherProof: isContr
        ? `FalkorDB Q60: MATCH (s:Statement {by: '${suspectId}'})-[:AT_TIME]->(t), (a:Anchor)-[:AT_TIME]->(t) WHERE s.room <> a.room RETURN clash`
        : isClr
        ? `FalkorDB Q63: MATCH (p:Person {id: '${suspectId}'})-[:CLAIMED]->(r:Room), path = shortestPath((r)-[:DOOR*]-(scene:Room)) WHERE length(path) > speed RETURN clearance`
        : `FalkorDB :Person {id: '${suspectId}'}`,
    });
  };

  const handleInspectRoom = (roomId: string) => {
    const room = caseData.rooms.find((r) => r.id === roomId);
    if (!room) return;

    const isCrimeScene = room.id === caseData.crimeScene;
    const roomEv = hardAnchors.filter((a) => a.room === room.id);
    const roomStmts = statements.filter((s) => s.room === room.id);

    setInspectedEntity({
      type: 'room',
      id: room.id,
      name: room.name,
      roleOrType: isCrimeScene ? 'Crime Scene (Study)' : 'Estate Room',
      status: roomEv.length > 0
        ? '🔍 Physical Evidence Discovered'
        : isCrimeScene
        ? '🚨 Murder Scene'
        : '📍 Location Node',
      statusVariant: roomEv.length > 0 ? 'brass' : isCrimeScene ? 'thread' : 'info',
      humanSummary: roomEv.length > 0
        ? `Physical anchor verified here: ${roomEv.map((e) => e.src || e.subject || 'log').join(', ')}.`
        : isCrimeScene
        ? `Lord Harrington was murdered here during the window (${murderTime}).`
        : `${roomStmts.length} suspect statements claim this location.`,
      cypherProof: `FalkorDB :Room {id: '${room.id}'} <-[:IN_ROOM]- (${roomEv.length > 0 ? ':Anchor' : ':Statement'})`,
    });
  };

  const handleInspectConflict = () => {
    setInspectedEntity({
      type: 'conflict',
      id: 'clash',
      name: 'Alibi Contradiction',
      roleOrType: 'FalkorDB Q60 Deduction',
      status: '🚨 Direct Spatial Conflict',
      statusVariant: 'thread',
      humanSummary:
        'A suspect claimed one room while hard evidence places them in a different room at the exact same timestamp. In FalkorDB, a person cannot occupy two rooms simultaneously.',
      cypherProof:
        'FalkorDB Q60: MATCH (s:Statement)-[:AT_TIME]->(t), (a:Anchor)-[:AT_TIME]->(t) WHERE s.room <> a.room RETURN s, a',
    });
  };

  return (
    <div
      data-tour="phone"
      className={`flex flex-col bg-surface-2 border border-border-strong rounded-2xl shadow-card overflow-hidden transition-all duration-200 select-none ${
        mode === 'docked' ? 'border-t-2 border-t-brass/40' : ''
      } ${className}`}
    >
      {/* 1. Phone Top Status Bar & Controls */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-3/90 border-b border-border text-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-1 border border-border shadow-xs">
            <Smartphone className="size-3.5 text-brass" />
            <span className="font-mono text-xs font-semibold tracking-wider text-brass uppercase">
              Pocket Graph
            </span>
            <span className="size-1.5 rounded-full bg-status-cleared animate-pulse ml-0.5" />
          </div>
          <span className="hidden sm:inline font-mono text-xs text-text-secondary">
            FalkorDB Engine · {statements.length} claims · {hardAnchors.length} anchors · {contradictions.length} clashes
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
                <g key={`stmt_edge_${s.id}_${idx}`} className="cursor-pointer" onClick={handleInspectConflict}>
                  {/* Connection Path */}
                  <path
                    d={`M ${start.x} ${start.y} Q ${midX} ${curveY} ${end.x} ${end.y}`}
                    strokeWidth={isContradicted ? 2.5 : 1.5}
                    className={`fill-none transition-all duration-300 ${
                      isContradicted
                        ? 'stroke-thread stroke-2 animate-pulse'
                        : 'stroke-brass/70 hover:stroke-brass'
                    }`}
                  />
                  {/* Timestamp Label Badge on edge */}
                  <g transform={`translate(${midX}, ${curveY})`}>
                    <rect
                      x="-28"
                      y="-10"
                      width="56"
                      height="20"
                      rx="10"
                      className={`stroke text-center shadow-xs ${
                        isContradicted
                          ? 'fill-surface-3 stroke-thread stroke-1.5'
                          : 'fill-surface-2 stroke-border'
                      }`}
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className="font-mono text-xs font-semibold fill-text-primary select-none" // design-ok: SVG graph edge label
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
                <g
                  key={`contra_line_${idx}`}
                  onClick={handleInspectConflict}
                  className="cursor-pointer group"
                >
                  <line
                    x1={suspectPoint.x}
                    y1={suspectPoint.y}
                    x2={roomPointA.x}
                    y2={roomPointA.y}
                    strokeWidth={2.5}
                    className="stroke-thread animate-pulse"
                    strokeDasharray="6 3"
                  />
                  <g transform={`translate(${(suspectPoint.x + roomPointA.x) / 2}, ${(suspectPoint.y + roomPointA.y) / 2})`}>
                    <rect
                      x="-54"
                      y="-11"
                      width="108"
                      height="22"
                      rx="6"
                      className="fill-surface-3 stroke-thread stroke-1.5 shadow-md"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      className="font-mono text-xs font-bold fill-thread uppercase tracking-wider select-none" // design-ok: SVG graph clash badge
                    >
                      CONTRADICTION
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
                <g
                  key={`room_node_${room.id}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => handleInspectRoom(room.id)}
                  className="cursor-pointer group"
                >
                  {/* Room pill */}
                  <rect
                    x="-65"
                    y="-18"
                    width="130"
                    height="36"
                    rx="18"
                    className={`transition-colors duration-150 ${
                      isCrimeScene
                        ? 'fill-surface-2 stroke-thread stroke-2'
                        : hasEvidenceInRoom
                        ? 'fill-surface-2 stroke-brass stroke-1.5'
                        : 'fill-surface-1 stroke-border-strong stroke-1 group-hover:stroke-border'
                    }`}
                  />
                  {/* Room Label */}
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    className="font-mono text-xs font-semibold fill-text-primary capitalize select-none" // design-ok: SVG room label
                  >
                    {room.name.length > 15 ? `${room.name.slice(0, 14)}…` : room.name}
                  </text>
                  {/* Evidence tag */}
                  {hasEvidenceInRoom && (
                    <circle cx="54" cy="0" r="4.5" className="fill-brass animate-pulse" />
                  )}
                  {isCrimeScene && (
                    <circle cx="-54" cy="0" r="4.5" className="fill-thread" />
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
                  onClick={() => handleInspectSuspect(p.id)}
                  className="cursor-pointer group"
                >
                  {/* Prime Suspect Crosshair Aura */}
                  {isPrime && (
                    <circle
                      r="30"
                      className="fill-none stroke-thread stroke-2 animate-ping opacity-60"
                    />
                  )}

                  {/* Outer circle */}
                  <circle
                    r="24"
                    strokeWidth={2}
                    className={`transition-all duration-200 ${
                      isContradicted
                        ? 'fill-surface-3 stroke-thread shadow-sm'
                        : isCleared
                        ? 'fill-surface-3 stroke-status-cleared'
                        : isSelected
                        ? 'fill-surface-3 stroke-brass ring-2 ring-brass'
                        : hasStatements
                        ? 'fill-surface-2 stroke-brass/80'
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
                    x="30"
                    y="4"
                    className="font-semibold text-xs fill-text-primary group-hover:fill-brass transition-colors select-none" // design-ok: SVG suspect name
                  >
                    {p.name.split(' ')[0]}
                  </text>

                  {/* Deduction State Badge */}
                  {isCleared && (
                    <g transform="translate(16, -15)">
                      <circle r="7.5" className="fill-surface-3 stroke-status-cleared stroke-1" />
                      <text textAnchor="middle" dy="3.5" className="font-mono text-xs fill-status-cleared font-bold"> {/* design-ok: SVG badge check */}
                        ✓
                      </text>
                    </g>
                  )}
                  {isContradicted && (
                    <g transform="translate(16, -15)">
                      <circle r="7.5" className="fill-surface-3 stroke-thread stroke-1" />
                      <text textAnchor="middle" dy="3.5" className="font-mono text-xs fill-thread font-bold"> {/* design-ok: SVG badge conflict */}
                        !
                      </text>
                    </g>
                  )}
                  {isPrime && (
                    <g transform="translate(16, -15)">
                      <circle r="8.5" className="fill-thread stroke-surface-1 stroke-1" />
                      <text textAnchor="middle" dy="3.5" className="font-mono text-xs fill-surface-1 font-bold"> {/* design-ok: SVG badge prime */}
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

      {/* 3. Interactive Inspector Card OR Live Deduction Ticker */}
      {inspectedEntity ? (
        <div className="p-3 bg-surface-3/95 border-t border-border flex flex-col gap-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-text-primary">
                {inspectedEntity.name}
              </span>
              <span className="text-xs text-text-tertiary">
                ({inspectedEntity.roleOrType})
              </span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  inspectedEntity.statusVariant === 'thread'
                    ? 'bg-thread/10 text-thread border-thread/30'
                    : inspectedEntity.statusVariant === 'success'
                    ? 'bg-status-cleared/10 text-status-cleared border-status-cleared/30'
                    : inspectedEntity.statusVariant === 'brass'
                    ? 'bg-brass/10 text-brass border-brass/30'
                    : 'bg-surface-2 text-text-secondary border-border'
                }`}
              >
                {inspectedEntity.status}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInspectedEntity(null)}
              className="h-6 w-6 p-0 text-text-tertiary hover:text-text-primary"
              title="Close Inspection"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            {inspectedEntity.humanSummary}
          </p>

          <div className="pt-1 flex flex-col gap-1.5 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCypherProof(!showCypherProof)}
              className="h-6 px-1.5 text-xs text-brass self-start gap-1 font-mono"
            >
              <Database className="size-3" />
              <span>{showCypherProof ? 'Hide FalkorDB Proof' : 'Inspect FalkorDB Proof (Cypher)'}</span>
              {showCypherProof ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </Button>

            {showCypherProof && (
              <div className="p-2 rounded-lg bg-surface-1 border border-border text-xs font-mono text-text-tertiary">
                <span className="text-brass block font-semibold mb-0.5">FalkorDB Graph Engine Query:</span>
                <p className="text-text-secondary">{inspectedEntity.cypherProof}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 bg-surface-3/90 border-t border-border flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="size-3.5 text-brass shrink-0" />
            <p
              className={`font-mono text-xs truncate ${
                tickerVariant === 'thread'
                  ? 'text-thread font-semibold'
                  : tickerVariant === 'success'
                  ? 'text-status-cleared font-semibold'
                  : tickerVariant === 'brass'
                  ? 'text-brass font-semibold'
                  : 'text-text-secondary'
              }`}
            >
              {tickerMessage}
            </p>
          </div>

          <div className="shrink-0 ml-2 hidden sm:flex items-center gap-2">
            <span className="font-mono text-xs text-text-tertiary">
              💡 Tap any node to inspect
            </span>
            {primeSuspect && statements.length >= 2 && (
              <span className="font-mono text-xs text-thread uppercase tracking-wider font-semibold">
                Target: {primeSuspect.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
