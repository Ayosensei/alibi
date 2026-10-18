'use client';

import * as React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import type { Room, Edge } from '@/engine/schema';

export interface MiniFloorPlanProps {
  caseId: string;
  rooms: Room[];
  edges: Edge[];
  crimeScene: string;
  searchedRooms: string[];
  exhibitsByRoom: Record<string, number>;
  hiddenEdgeKnown?: boolean;
  onSearchRoom?: (roomId: string) => void;
  isSearching?: boolean;
}

interface RoomCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 2D coordinate maps tailored to each case topology for maximum visual clarity
const TOPOLOGIES: Record<string, Record<string, RoomCoord>> = {
  // Case 1: The Quiet Pact (Playhouse)
  'l1-quiet-pact': {
    box_office: { x: 18, y: 130, w: 82, h: 42 },
    foyer: { x: 18, y: 24, w: 82, h: 42 },
    stage: { x: 128, y: 24, w: 82, h: 42 },
    lighting_booth: { x: 128, y: 130, w: 82, h: 42 },
    green_room: { x: 238, y: 24, w: 82, h: 42 },
    prop_store: { x: 238, y: 130, w: 82, h: 42 }, // Crime scene
  },

  // Case 2: The Stopped Watch (Auction house)
  'l2-stopped-watch': {
    cloakroom: { x: 18, y: 130, w: 82, h: 40 },
    foyer: { x: 18, y: 24, w: 82, h: 40 },
    main_hall: { x: 128, y: 24, w: 84, h: 40 },
    courtyard: { x: 128, y: 130, w: 84, h: 40 },
    cabinet_room: { x: 238, y: 24, w: 82, h: 40 }, // Crime scene
    catalogue_office: { x: 238, y: 95, w: 82, h: 36 },
    vault: { x: 238, y: 148, w: 82, h: 36 },
  },

  // Case 3: The Blackout Dinner (Manor house with locked door & secret passage)
  'l3-blackout-dinner': {
    dining_hall: { x: 18, y: 24, w: 80, h: 40 },
    kitchen: { x: 18, y: 134, w: 80, h: 40 },
    hall: { x: 128, y: 24, w: 82, h: 40 },
    library: { x: 128, y: 134, w: 82, h: 40 },
    drawing_room: { x: 238, y: 24, w: 82, h: 38 },
    conservatory: { x: 238, y: 78, w: 82, h: 38 },
    study: { x: 238, y: 134, w: 82, h: 40 }, // Crime scene
  },
};

export function MiniFloorPlan({
  caseId,
  rooms,
  edges,
  crimeScene,
  searchedRooms,
  exhibitsByRoom,
  hiddenEdgeKnown = false,
  onSearchRoom,
  isSearching = false,
}: MiniFloorPlanProps) {
  const searchedSet = React.useMemo(() => new Set(searchedRooms), [searchedRooms]);
  const coords = TOPOLOGIES[caseId] ?? {};

  // If secret passage was discovered in Case 3, reveal the hidden edge
  const displayEdges = React.useMemo(() => {
    const list = [...edges];
    if (hiddenEdgeKnown && caseId === 'l3-blackout-dinner') {
      const alreadyHasHidden = list.some(
        (e) => (e.a === 'library' && e.b === 'study') || (e.a === 'study' && e.b === 'library')
      );
      if (!alreadyHasHidden) {
        list.push({ a: 'library', b: 'study', state: 'hidden' });
      }
    }
    return list;
  }, [edges, hiddenEdgeKnown, caseId]);

  // Calculate center of a room card for connecting hallway lines
  const getCenter = (roomId: string) => {
    const c = coords[roomId];
    if (!c) return { x: 170, y: 100 };
    return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
  };

  return (
    <div className="w-full bg-surface-2/40 border border-border rounded-xl p-3 flex flex-col space-y-2 select-none overflow-hidden">
      {/* Floor Plan Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-mono text-brass uppercase tracking-wider">
          <MapPin className="size-3 text-brass" />
          <span>Spatial Layout & Corridors</span>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary font-mono">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-thread" />
            <span>Scene</span>
          </span>
          {hiddenEdgeKnown && (
            <span className="flex items-center gap-1 text-brass animate-pulse">
              <Sparkles className="size-2.5 text-brass" />
              <span>Passage Open</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive SVG Diagram */}
      <div className="relative w-full aspect-[340/200] max-h-[220px]">
        <svg
          viewBox="0 0 340 200"
          className="size-full overflow-visible font-sans"
          role="img"
          aria-label="Scene Floor Plan Map"
        >
          {/* 1. Connecting Hallway Edges */}
          <g className="connections">
            {displayEdges.map((edge) => {
              const start = getCenter(edge.a);
              const end = getCenter(edge.b);
              const isLocked = edge.state === 'locked';
              const isHidden = edge.state === 'hidden';

              // If hidden edge is NOT discovered yet, do not draw it
              if (isHidden && !hiddenEdgeKnown) {
                return null;
              }

              const edgeKey = `${edge.a}_${edge.b}`;

              return (
                <g key={edgeKey}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    strokeWidth={isHidden && hiddenEdgeKnown ? 2.5 : 2}
                    strokeDasharray={isHidden && hiddenEdgeKnown ? '4 3' : isLocked ? '3 3' : undefined}
                    className={`transition-all duration-300 ${
                      isHidden && hiddenEdgeKnown
                        ? 'stroke-brass animate-pulse'
                        : isLocked
                        ? 'stroke-danger/60'
                        : 'stroke-border-strong'
                    }`}
                  />

                  {/* Locked indicator badge on locked doors */}
                  {isLocked && (
                    <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}>
                      <circle r="7" strokeWidth={1} className="fill-surface-1 stroke-danger" />
                      <path
                        d="M -3 0 L 3 0 L 3 4 L -3 4 Z M -2 0 A 2 2 0 0 1 2 0"
                        strokeWidth={1}
                        className="fill-none stroke-danger"
                      />
                    </g>
                  )}

                  {/* Secret passage badge on discovered hidden doors */}
                  {isHidden && hiddenEdgeKnown && (
                    <g transform={`translate(${(start.x + end.x) / 2}, ${(start.y + end.y) / 2})`}>
                      <rect
                        x="-18"
                        y="-7"
                        width="36"
                        height="14"
                        rx="4"
                        strokeWidth={1}
                        className="fill-surface-1 stroke-brass"
                      />
                      <text
                        x="0"
                        y="3.5"
                        fontSize="8"
                        textAnchor="middle"
                        className="fill-brass font-mono font-bold"
                      >
                        SECRET
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Room Nodes */}
          {rooms.map((room) => {
            const pos = coords[room.id] ?? { x: 20, y: 20, w: 80, h: 40 };
            const isSearched = searchedSet.has(room.id);
            const isCrimeScene = room.id === crimeScene;
            const exhibits = exhibitsByRoom[room.id] ?? 0;

            return (
              <g
                key={room.id}
                className={`group ${isSearched ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !isSearched && !isSearching && onSearchRoom && onSearchRoom(room.id)}
              >
                <title>{`${room.name}${isCrimeScene ? ' (Crime Scene)' : ''} - ${isSearched ? 'Searched' : 'Click to search'}`}</title>
                {/* Room Card Background */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={pos.w}
                  height={pos.h}
                  rx="6"
                  strokeWidth={isCrimeScene ? 1.5 : 1}
                  className={`transition-colors duration-150 ${
                    isCrimeScene
                      ? 'fill-surface-2 stroke-thread shadow-sm'
                      : isSearched
                      ? 'fill-surface-1/90 stroke-border-strong'
                      : 'fill-surface-2 stroke-border group-hover:stroke-brass'
                  }`}
                />

                {/* Crime Scene Accent Pip */}
                {isCrimeScene && (
                  <circle cx={pos.x + 8} cy={pos.y + 11} r="2.5" className="fill-thread" />
                )}

                {/* Room Title */}
                <text
                  x={isCrimeScene ? pos.x + 15 : pos.x + 8}
                  y={pos.y + 14}
                  fontSize="10"
                  className={`font-medium select-none truncate ${
                    isCrimeScene
                      ? 'fill-thread font-semibold'
                      : isSearched
                      ? 'fill-text-secondary'
                      : 'fill-text-primary'
                  }`}
                >
                  {room.name.length > 12 ? `${room.name.slice(0, 11)}…` : room.name}
                </text>

                {/* Exhibits Badge */}
                {exhibits > 0 && (
                  <g transform={`translate(${pos.x + 8}, ${pos.y + 25})`}>
                    <rect
                      x="0"
                      y="-7"
                      width="28"
                      height="11"
                      rx="3"
                      strokeWidth={0.5}
                      className="fill-surface-3 stroke-border"
                    />
                    <text
                      x="14"
                      y="1.5"
                      fontSize="8.5"
                      textAnchor="middle"
                      className="fill-text-secondary font-mono"
                    >
                      {exhibits} ex.
                    </text>
                  </g>
                )}

                {/* Search / Done Status Indicator in Bottom Right */}
                <g transform={`translate(${pos.x + pos.w - 12}, ${pos.y + pos.h - 12})`}>
                  {isSearched ? (
                    <g>
                      <circle r="4.5" className="fill-status-cleared" />
                      <path
                        d="M -2.2 0 L -0.5 2 L 2.5 -1.5"
                        strokeWidth={1}
                        className="fill-none stroke-background"
                      />
                    </g>
                  ) : (
                    <g>
                      <circle
                        r="4.5"
                        strokeWidth={0.8}
                        className="fill-surface-3 stroke-border-strong group-hover:stroke-brass group-hover:fill-brass/20"
                      />
                      <circle r="1.5" className="fill-text-tertiary group-hover:fill-brass" />
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Quick Footnote & Search Action Guide */}
      <div className="flex items-center justify-between text-xs text-text-tertiary pt-1 border-t border-border/40 font-mono">
        <span>Click room to search</span>
        <span>
          {searchedSet.size}/{rooms.length} explored
        </span>
      </div>
    </div>
  );
}
