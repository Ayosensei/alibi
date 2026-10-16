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

export function shortestPath(
  adj: Map<string, string[]>,
  from: string,
  to: string
): { distance: number; path: string[] } {
  if (from === to) return { distance: 0, path: [from] };
  const seen = new Set<string>([from]);
  let frontier: Array<{ node: string; path: string[] }> = [{ node: from, path: [from] }];
  let d = 0;

  while (frontier.length > 0) {
    d++;
    const next: Array<{ node: string; path: string[] }> = [];
    for (const item of frontier) {
      for (const m of adj.get(item.node) ?? []) {
        if (m === to) return { distance: d, path: [...item.path, m] };
        if (!seen.has(m)) {
          seen.add(m);
          next.push({ node: m, path: [...item.path, m] });
        }
      }
    }
    frontier = next;
  }

  return { distance: Infinity, path: [] };
}

export function dist(adj: Map<string, string[]>, from: string, to: string): number {
  return shortestPath(adj, from, to).distance;
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
    const { distance: d, path } = shortestPath(adj, a.room, room);
    const available = Math.abs(slot - a.slot);
    if (d > available) {
      violations.push({
        anchor: a.src,
        slot: a.slot,
        room: a.room,
        needed: d,
        available,
        path,
      });
    }
  }

  return {
    feasible: reachable && violations.length === 0,
    reachable,
    violations,
  };
}
