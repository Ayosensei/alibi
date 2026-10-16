'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Chip, EmptyState } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import { copy } from '@/lib/copy';
import type { Topic } from '@/engine/contract';
import { z } from 'zod';
import {
  MessageSquare,
  Clock,
  UserCheck,
  HeartCrack,
  Moon,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export function InterrogationPanel() {
  const {
    caseData,
    board,
    selectedSuspectId,
    chatHistory,
    isAsking,
    askQuestion,
  } = useGameStore();

  const [activePicker, setActivePicker] = React.useState<'none' | 'where' | 'saw'>('none');
  const [selectedSlot, setSelectedSlot] = React.useState<number | null>(null);
  const [selectedWitnessTarget, setSelectedWitnessTarget] = React.useState<string | null>(null);
  const [exhaustedKeys, setExhaustedKeys] = React.useState<Set<string>>(new Set());

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const suspect = caseData?.people.find((p) => p.id === selectedSuspectId);
  const victim = caseData?.people.find((p) => p.victim);

  // Active murder window & lead calculation
  const activeWindow = board?.window ?? caseData?.publicWindow ?? [5];
  const murderSlot = activeWindow[0] ?? 5;
  const murderTime = caseData?.slots[murderSlot - 1] ?? `Slot ${murderSlot}`;

  const existingMurderStatement = board?.statements.find(
    (s) => s.by === suspect?.id && s.slot === murderSlot && s.kind === 'location'
  );

  // Filter messages for current suspect
  const suspectMessages = chatHistory.filter(
    (m) => m.suspectId === selectedSuspectId
  );

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [suspectMessages, isAsking]);

  const getQuestionKey = (
    suspectId: string,
    topic: string,
    slot?: number | null,
    about?: string | null
  ) => `${suspectId}_${topic}_${slot ?? ''}_${about ?? ''}`;

  const handleAsk = async (
    topic: z.infer<typeof Topic>,
    slot?: number,
    about?: string
  ) => {
    if (!selectedSuspectId) return;

    const qKey = getQuestionKey(selectedSuspectId, topic, slot, about);
    setActivePicker('none');
    setSelectedSlot(null);
    setSelectedWitnessTarget(null);

    const res = await askQuestion(topic, slot, about);
    if (res && res.status === 'nothing_new') {
      setExhaustedKeys((prev) => new Set([...prev, qKey]));
    }
  };

  if (!suspect) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center p-6 bg-surface-1">
        <EmptyState
          titlePrefix="Select a "
          titleItalic="suspect"
          titleSuffix=" to interrogate."
          description="Choose a person of interest from the left dossier to review their statements or ask questions."
          icon={<MessageSquare className="size-6 text-text-tertiary" />}
        />
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-surface-1 border-r border-border min-w-0 h-full overflow-hidden">
      {/* 1. Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-full bg-surface-3 flex items-center justify-center text-text-primary text-xs font-semibold ring-1 ring-border">
            {suspect.name
              .split(/\s+/)
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-text-primary truncate">
              {suspect.name}
            </span>
            <span className="text-xs text-text-secondary truncate">
              {suspect.role}
            </span>
          </div>
        </div>

        <Chip variant="default" className="text-xs hidden sm:inline-flex">
          Interrogation Room
        </Chip>
      </div>

      {/* 2. Messages List */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Suspect Interrogation Dialogue"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {suspectMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-tertiary space-y-2">
            <MessageSquare className="size-8 text-text-tertiary/60" />
            <p className="text-xs max-w-xs">
              No questions asked yet. Inquire about whereabouts, sightings, or relations below.
            </p>
          </div>
        ) : (
          suspectMessages.map((msg) => {
            const isPlayer = msg.speaker === 'player';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-md p-3 rounded-xl text-xs md:text-sm leading-relaxed ${
                    isPlayer
                      ? 'bg-surface-3 text-text-primary shadow-sm rounded-tr-none'
                      : 'bg-surface-2 text-text-primary border-l-2 border-brass shadow-card rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {/* Suspect observation tell */}
                {!isPlayer && msg.observation && (
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary italic pl-2">
                    <Sparkles className="size-3 text-brass/70 shrink-0" />
                    <span>{msg.observation}</span>
                  </div>
                )}

                {/* Firewall replacement alert */}
                {!isPlayer && msg.firewallWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-danger/80 pl-2">
                    <ShieldAlert className="size-3 shrink-0" />
                    <span className="text-xs">{copy.fw}</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isAsking && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-2 text-text-secondary text-xs w-fit border border-border/40 animate-pulse">
            <Loader2 className="size-3 animate-spin text-brass" />
            <span>{suspect.name} is responding...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Slot / Person Secondary Pickers */}
      {activePicker !== 'none' && caseData && (
        <div className="p-3 bg-surface-2 border-t border-border space-y-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between text-xs font-mono text-brass uppercase">
            <span>
              {activePicker === 'where'
                ? 'Select Time Slot'
                : selectedSlot === null
                ? '1. Select Time Slot'
                : '2. Select Person Seen'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActivePicker('none');
                setSelectedSlot(null);
                setSelectedWitnessTarget(null);
              }}
              className="h-5 px-1.5 text-xs text-text-tertiary hover:text-text-primary"
            >
              Cancel
            </Button>
          </div>

          {/* Time Slot Picker (1..8) */}
          {(activePicker === 'where' || (activePicker === 'saw' && selectedSlot === null)) && (
            <div className="grid grid-cols-4 gap-1.5">
              {caseData.slots.map((timeStr, idx) => {
                const slotNum = idx + 1;
                const slotKey = getQuestionKey(
                  suspect.id,
                  activePicker === 'where' ? 'whereabouts' : 'witness',
                  slotNum
                );
                const isExhausted = exhaustedKeys.has(slotKey);

                return (
                  <Button
                    key={slotNum}
                    variant={isExhausted ? 'ghost' : 'secondary'}
                    size="sm"
                    disabled={isExhausted || isAsking}
                    onClick={() => {
                      if (activePicker === 'where') {
                        handleAsk('whereabouts', slotNum);
                      } else {
                        setSelectedSlot(slotNum);
                      }
                    }}
                    className={`text-xs font-mono py-1 px-2 h-auto flex flex-col items-center gap-0.5 ${
                      isExhausted ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    <span className="font-bold text-text-primary">{timeStr}</span>
                    <span className="text-text-tertiary text-xs">Slot {slotNum}</span>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Witness Target Picker */}
          {activePicker === 'saw' && selectedSlot !== null && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {caseData.people
                .filter((p) => p.id !== suspect.id)
                .map((target) => {
                  const witnessKey = getQuestionKey(
                    suspect.id,
                    'witness',
                    selectedSlot,
                    target.id
                  );
                  const isExhausted = exhaustedKeys.has(witnessKey);

                  return (
                    <Button
                      key={target.id}
                      variant={isExhausted ? 'ghost' : 'secondary'}
                      size="sm"
                      disabled={isExhausted || isAsking}
                      onClick={() => handleAsk('witness', selectedSlot, target.id)}
                      className={`text-xs truncate justify-start ${
                        isExhausted ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      {target.name}
                    </Button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 4. Question Topic Chips */}
      <div className="p-3 bg-surface-1 border-t border-border space-y-3">
        {/* 1-Click Primary Murder Lead Question */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider">
            <span className="text-brass font-semibold">Crucial Lead</span>
            <span className="text-text-secondary">Time of Murder: {murderTime}</span>
          </div>

          <Button
            variant="secondary"
            size="default"
            disabled={isAsking}
            onClick={() => handleAsk('whereabouts', murderSlot)}
            className={`w-full justify-between h-auto py-2.5 px-3 text-left transition-all ${
              existingMurderStatement
                ? 'bg-surface-2 hover:bg-surface-3 border border-border'
                : 'bg-surface-2 hover:bg-surface-3 border-2 border-brass shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {existingMurderStatement ? (
                <CheckCircle2 className="size-4 text-brass shrink-0" />
              ) : (
                <Clock className="size-4 text-brass shrink-0 animate-pulse" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs md:text-sm text-text-primary truncate">
                  Where were you at {murderTime}?
                </span>
                <span className="text-xs text-text-secondary truncate">
                  {existingMurderStatement
                    ? `Claimed: ${existingMurderStatement.room?.replace(/_/g, ' ')}`
                    : 'Ask whereabouts during the time of murder'}
                </span>
              </div>
            </div>
            <span
              className={`font-mono text-xs px-2.5 py-1 rounded font-medium shrink-0 ml-2 ${
                existingMurderStatement
                  ? 'bg-surface-3 text-text-secondary border border-border'
                  : 'bg-brass text-on-brass'
              }`}
            >
              {existingMurderStatement ? 'Re-Ask' : '1-Click Ask'}
            </span>
          </Button>
        </div>

        {/* Other Inquiries */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider block">
            Other Inquiries & History
          </span>

          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={activePicker === 'where' ? 'brass' : 'secondary'}
              size="sm"
              disabled={isAsking}
              onClick={() => setActivePicker(activePicker === 'where' ? 'none' : 'where')}
              className="text-xs"
            >
              <Clock className="size-3 mr-1" />
              Other Times
            </Button>

            <Button
              variant={activePicker === 'saw' ? 'brass' : 'secondary'}
              size="sm"
              disabled={isAsking}
              onClick={() => setActivePicker(activePicker === 'saw' ? 'none' : 'saw')}
              className="text-xs"
            >
              <UserCheck className="size-3 mr-1" />
              Who did you see?
            </Button>

          {victim && (
            <Button
              variant={
                exhaustedKeys.has(getQuestionKey(suspect.id, 'motive'))
                  ? 'ghost'
                  : 'secondary'
              }
              size="sm"
              disabled={
                isAsking ||
                exhaustedKeys.has(getQuestionKey(suspect.id, 'motive'))
              }
              onClick={() => handleAsk('motive')}
              className={`text-xs ${
                exhaustedKeys.has(getQuestionKey(suspect.id, 'motive'))
                  ? 'opacity-40'
                  : ''
              }`}
            >
              <HeartCrack className="size-3 mr-1" />
              History with {victim.name.split(' ')[0]}
            </Button>
          )}

          <Button
            variant={
              exhaustedKeys.has(getQuestionKey(suspect.id, 'general'))
                ? 'ghost'
                : 'secondary'
            }
              size="sm"
            disabled={
              isAsking ||
              exhaustedKeys.has(getQuestionKey(suspect.id, 'general'))
            }
            onClick={() => handleAsk('general')}
            className={`text-xs ${
              exhaustedKeys.has(getQuestionKey(suspect.id, 'general'))
                ? 'opacity-40'
                : ''
            }`}
          >
            <Moon className="size-3 mr-1" />
            About the night
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isAsking}
            onClick={() => handleAsk('general')}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            <HelpCircle className="size-3 mr-1" />
            Anything else?
          </Button>
        </div>
      </div>
    </div>
  </section>
);
}
