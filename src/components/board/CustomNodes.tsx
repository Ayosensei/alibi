'use client';

import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Stamp, Chip } from '@/components/atoms';
import {
  Feather,
  Pin,
  Sparkles,
  AlertTriangle,
  Skull,
  User,
  ShieldAlert,
} from 'lucide-react';

export interface PersonNodeData {
  id: string;
  name: string;
  role: string;
  victim?: boolean;
  selected?: boolean;
  isHighlighted?: boolean;
}

export function PersonNode({ data }: { data: PersonNodeData }) {
  const isVictim = data.victim;
  const isSelected = data.selected;
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`relative w-64 p-3 rounded-xl bg-surface-2 border transition-all duration-200 select-none ${
        isHighlighted
          ? 'border-thread ring-2 ring-thread/80 shadow-thread'
          : isSelected
          ? 'border-brass ring-2 ring-brass/60 shadow-card'
          : 'border-border shadow-card hover:border-border-strong'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <div className="flex items-center gap-3">
        <div
          className={`size-10 rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0 border ${
            isVictim
              ? 'bg-thread/20 text-thread border-thread/40'
              : 'bg-surface-3 text-text-primary border-border'
          }`}
        >
          {isVictim ? <Skull className="size-5" /> : data.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-serif font-semibold text-text-primary text-sm truncate">
              {data.name}
            </span>
            {isVictim && (
              <span className="font-mono text-xs text-thread uppercase tracking-wider">
                Victim
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-text-tertiary block truncate">
            {data.role}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}

export interface StatementNodeData {
  id: string;
  claimId: string;
  by: string;
  text: string;
  room?: string;
  slot?: number;
  tick: number;
  isContradicted?: boolean;
  isHighlighted?: boolean;
}

export function StatementNode({ data }: { data: StatementNodeData }) {
  const isContradicted = data.isContradicted;
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`relative w-64 p-3 rounded-md bg-paper text-ink shadow-polaroid border transition-all duration-200 select-none ${
        isContradicted || isHighlighted
          ? 'border-thread ring-2 ring-thread shadow-thread'
          : 'border-ink/20 hover:border-ink/40'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-ink/15 pb-1 mb-1.5">
        <div className="flex items-center gap-1 font-mono text-xs font-semibold uppercase text-ink/70">
          <Feather className="size-3 text-ink/60" />
          <span>Statement · {data.by}</span>
        </div>
        <span className="font-mono text-xs text-ink/50">T{data.tick}</span>
      </div>

      <p className="text-xs text-ink/90 leading-relaxed italic mb-2">
        "{data.text}"
      </p>

      {(data.room || data.slot) && (
        <div className="flex items-center justify-between text-xs font-mono text-ink/70 pt-1 border-t border-ink/10">
          {data.room && <span className="capitalize">{data.room.replace(/_/g, ' ')}</span>}
          {data.slot && <span>Slot {data.slot}</span>}
        </div>
      )}

      {isContradicted && (
        <div className="absolute -top-2.5 -right-2 transform rotate-3">
          <Stamp status="contradiction" label="CONTRADICTION" />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}

export interface EvidenceNodeData {
  id: string;
  title: string;
  text: string;
  room: string;
  isHighlighted?: boolean;
}

export function EvidenceNode({ data }: { data: EvidenceNodeData }) {
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`relative w-64 p-3 rounded-sm bg-paper text-ink shadow-polaroid border transition-all duration-200 select-none ${
        isHighlighted
          ? 'border-thread ring-2 ring-thread shadow-thread'
          : 'border-ink/20 hover:border-ink/40'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-ink/15 pb-1 mb-1.5">
        <span className="font-mono text-xs font-semibold uppercase text-ink/70">
          EXHIBIT {data.id.toUpperCase()}
        </span>
        <Pin className="size-3 text-ink/50" />
      </div>

      <div className="font-semibold text-xs text-ink/95 mb-1">{data.title}</div>
      <p className="text-xs text-ink/80 leading-normal mb-2 line-clamp-3">
        {data.text}
      </p>

      <div className="font-mono text-xs text-ink/60 pt-1 border-t border-ink/10 flex items-center justify-between">
        <span>Found in:</span>
        <span className="capitalize text-ink/80">{data.room.replace(/_/g, ' ')}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}

export interface FlagNodeData {
  id: string;
  kind: string;
  note: string;
  by: 'player' | 'inspector';
  isHighlighted?: boolean;
}

export function FlagNode({ data }: { data: FlagNodeData }) {
  const isInspector = data.by === 'inspector';

  return (
    <div
      className={`relative w-60 p-3 rounded-xl bg-surface-2 border transition-all duration-200 select-none ${
        data.isHighlighted
          ? 'border-thread ring-2 ring-thread/80 shadow-thread'
          : isInspector
          ? 'border-inspector/50 shadow-card'
          : 'border-brass/50 shadow-card'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <Stamp
          status={
            data.kind === 'contradiction'
              ? 'contradiction'
              : data.kind === 'rehearsed'
              ? 'rehearsed'
              : data.kind === 'impossible'
              ? 'impossible'
              : 'inferred'
          }
          label={data.kind.toUpperCase()}
        />
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
            isInspector
              ? 'bg-inspector/10 text-inspector border-inspector/30'
              : 'bg-brass/10 text-brass border-brass/30'
          }`}
        >
          {data.by}
        </span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {data.note}
      </p>
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}

export interface HypothesisNodeData {
  id: string;
  text: string;
  person?: string;
  confidence: number;
  by: 'player' | 'inspector';
  isHighlighted?: boolean;
}

export function HypothesisNode({ data }: { data: HypothesisNodeData }) {
  const isInspector = data.by === 'inspector';

  return (
    <div
      className={`relative w-64 p-3 rounded-xl bg-surface-2 border transition-all duration-200 select-none ${
        data.isHighlighted
          ? 'border-thread ring-2 ring-thread/80 shadow-thread'
          : 'border-inspector/60 shadow-card'
      }`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-inspector font-mono text-xs font-semibold uppercase">
          <Sparkles className="size-3" />
          <span>Hypothesis</span>
        </div>
        <span className="font-mono text-xs text-text-primary px-1.5 py-0.5 rounded bg-surface-3 border border-border">
          {Math.round(data.confidence * 100)}%
        </span>
      </div>
      <p className="text-xs text-text-primary leading-relaxed mb-2">
        {data.text}
      </p>
      {data.person && (
        <div className="font-mono text-xs text-text-tertiary capitalize pt-1 border-t border-border flex items-center justify-between">
          <span>Subject:</span>
          <span className="text-text-secondary">{data.person}</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}
