'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Chip, SuspectCard } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  Search,
  Check,
  Sparkles,
  MapPin,
  Lock,
  DoorOpen,
} from 'lucide-react';
import { MiniFloorPlan } from '@/components/map/MiniFloorPlan';


export function SuspectsPanel() {
  const [roomsView, setRoomsView] = React.useState<'map' | 'list'>('map');
  const {

    caseData,
    board,
    chatHistory,
    selectedSuspectId,
    selectSuspect,
    searchRoomAction,
    setBaitModalOpen,
    isLoading,
  } = useGameStore();

  if (!caseData) return null;

  const searchedSet = new Set(board?.searchedRooms ?? []);
  const baitsLeft = board?.baitsLeft ?? caseData.baitsAllowed;

  const exhibitsByRoom = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const ev of board?.evidence ?? []) {
      if (ev.room) {
        map[ev.room] = (map[ev.room] ?? 0) + 1;
      }
    }
    return map;
  }, [board?.evidence]);

  return (
    <aside className="w-full h-full flex flex-col bg-surface-1 border-r border-border overflow-y-auto overflow-x-hidden p-3 sm:p-3.5 space-y-5 select-none">
      {/* 1. Suspects Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Persons of Interest
          </span>
          <span className="text-xs text-text-tertiary font-mono tabular-nums">
            {caseData.people.filter((p) => !p.victim).length} Suspects
          </span>
        </div>

        <div className="space-y-2">
          {caseData.people.map((person) => {
            // Count statements and observations for this person from board
            const statementsCount =
              board?.statements.filter((s) => s.by === person.id).length ?? 0;
            const hasInquiries = (chatHistory ?? []).some(
              (m) => m.suspectId === person.id && m.speaker === 'player'
            );
            // Observations count from chat history
            const observationsCount = 0;

            return (
              <SuspectCard
                key={person.id}
                id={person.id}
                name={person.name}
                role={person.role}
                isVictim={person.victim}
                statementsCount={statementsCount}
                hasInquiries={hasInquiries}
                observationsCount={observationsCount}
                isSelected={selectedSuspectId === person.id}
                onClick={() => !person.victim && selectSuspect(person.id)}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Rooms & Search Section */}
      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Rooms & Scene
            </span>
            <div className="flex items-center rounded border border-border bg-surface-2 p-0.5">
              <Button
                variant={roomsView === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-5 px-1.5 text-xs font-mono"
                onClick={() => setRoomsView('map')}
              >
                Map
              </Button>
              <Button
                variant={roomsView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-5 px-1.5 text-xs font-mono"
                onClick={() => setRoomsView('list')}
              >
                List
              </Button>
            </div>
          </div>
          <span className="text-xs text-text-tertiary font-mono tabular-nums">
            {searchedSet.size}/{caseData.rooms.length} Searched
          </span>
        </div>

        {roomsView === 'map' ? (
          <MiniFloorPlan
            caseId={caseData.caseId}
            rooms={caseData.rooms}
            edges={caseData.edges}
            crimeScene={caseData.crimeScene}
            searchedRooms={board?.searchedRooms ?? []}
            exhibitsByRoom={exhibitsByRoom}
            hiddenEdgeKnown={board?.hiddenEdgeKnown ?? false}
            onSearchRoom={(roomId) => searchRoomAction(roomId)}
            isSearching={isLoading}
          />
        ) : (
          <div className="space-y-1.5">
            {caseData.rooms.map((room) => {
              const isSearched = searchedSet.has(room.id);
              const isCrimeScene = room.id === caseData.crimeScene;

              // Count exhibits in this room discovered on board
              const roomExhibits =
                board?.evidence.filter((e) => e.room === room.id).length ?? 0;

              return (
                <div
                  key={room.id}
                  className={`flex items-center justify-between gap-1.5 p-2 rounded-lg border text-xs transition-colors min-w-0 ${
                  isSearched
                    ? 'bg-surface-2/60 border-border/40 text-text-secondary'
                    : 'bg-surface-2 border-border text-text-primary'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <MapPin
                    className={`size-3.5 shrink-0 ${
                      isCrimeScene ? 'text-thread' : 'text-text-tertiary'
                    }`}
                  />
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="font-medium text-sm truncate">{room.name}</span>
                    {isCrimeScene && (
                      <span className="font-mono text-xs text-thread shrink-0">
                        (Scene)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {roomExhibits > 0 && (
                    <Chip variant="default" className="text-xs px-1.5 py-0 shrink-0">
                      {roomExhibits} {roomExhibits === 1 ? 'ex.' : 'ex.'}
                    </Chip>
                  )}

                  <Button
                    variant={isSearched ? 'ghost' : 'secondary'}
                    size="sm"
                    data-room-search={room.id}
                    disabled={isSearched || isLoading}
                    onClick={() => searchRoomAction(room.id)}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {isSearched ? (
                      <>
                        <Check className="size-3 text-status-cleared mr-1" />
                        Done
                      </>
                    ) : (
                      <>
                        <Search className="size-3 mr-1" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* 3. Bait Announcement Section */}
      {caseData.baitsAllowed > 0 && (
        <div className="border-t border-border pt-4">
          <Button
            variant="brass"
            size="default"
            disabled={baitsLeft <= 0}
            onClick={() => setBaitModalOpen(true)}
            className="w-full justify-between"
            title="Use Bait Announcement (B)"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <span>Use Bait Announcement</span>
            </div>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-1 text-brass border border-brass/40">
              {baitsLeft} left
            </span>
          </Button>
        </div>
      )}
    </aside>
  );
}
