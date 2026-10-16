import type { Violation } from './contract';
import type { z } from 'zod';

export interface MapEdgeRecord {
  a: string;
  b: string;
  t: string; // 'CONNECTS' | 'HIDDEN_KNOWN'
  state?: string; // 'open' | 'locked' | 'hidden'
  knowers?: string[];
}

export interface HardAnchorRecord {
  src: string;
  subject: string;
  slot: number;
  room: string;
}

export interface FeasibilityResult {
  feasible: boolean;
  reachable: boolean;
  violations: z.infer<typeof Violation>[];
}

export function buildAdjacency(
  rooms: string[],
  edges: MapEdgeRecord[],
  person?: string
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const r of rooms) {
    adj.set(r, []);
  }

  for (const e of edges) {
    let isOpen = false;
    if (e.t === 'CONNECTS' && e.state === 'open') {
      isOpen = true;
    } else if (e.t === 'HIDDEN_KNOWN') {
      // Hidden edge: usable if knowers is empty/absent OR person is included
      if (!person || !e.knowers || e.knowers.length === 0 || e.knowers.includes(person)) {
        isOpen = true;
      }
    }

    if (isOpen) {
      adj.get(e.a)?.push(e.b);
      adj.get(e.b)?.push(e.a);
    }
  }

  return adj;
}

export function dist(adj: Map<string, string[]>, from: string, to: string): number {
  if (from === to) return 0;
  const seen = new Set<string>([from]);
  let frontier = [from];
  let d = 0;

  while (frontier.length > 0) {
    d++;
    const next: string[] = [];
    for (const n of frontier) {
      for (const m of adj.get(n) ?? []) {
        if (m === to) return d;
        if (!seen.has(m)) {
          seen.add(m);
          next.push(m);
        }
      }
    }
    frontier = next;
  }

  return Infinity;
}

export function checkFeasibility(
  person: string,
  slot: number,
  room: string,
  rooms: string[],
  edges: MapEdgeRecord[],
  hardAnchors: HardAnchorRecord[]
): FeasibilityResult {
  const adj = buildAdjacency(rooms, edges, person);
  const violations: z.infer<typeof Violation>[] = [];
  const degree = (adj.get(room) ?? []).length;
  const reachable = degree > 0;

  if (!reachable) {
    violations.push({ reason: 'room not reachable for this person' });
  }

  for (const a of hardAnchors.filter((x) => x.subject === person)) {
    const d = dist(adj, a.room, room);
    const available = Math.abs(slot - a.slot);
    if (d > available) {
      violations.push({
        anchor: a.src,
        slot: a.slot,
        room: a.room,
        needed: d,
        available,
      });
    }
  }

  return {
    feasible: reachable && violations.length === 0,
    reachable,
    violations,
  };
}
