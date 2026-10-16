// reference-engine.mjs
// Pure JavaScript reference implementation of Alibi's reasoning tools.
// It is the ORACLE: the Cypher-backed tools in src/engine must return the same results on the same board.
// No dependencies. Slots are 1-based. Rooms and people are string ids.

export function graphFor(c, { lockedOpen = false, hiddenOpen = false } = {}) {
  const adj = new Map(c.rooms.map((r) => [r.id, []]));
  for (const e of c.edges) {
    const open = e.state === 'open' || (e.state === 'locked' && lockedOpen) || (e.state === 'hidden' && hiddenOpen);
    if (!open) continue;
    adj.get(e.a).push(e.b);
    adj.get(e.b).push(e.a);
  }
  return adj;
}

export function dist(adj, from, to) {
  if (from === to) return 0;
  const seen = new Set([from]);
  let frontier = [from];
  let d = 0;
  while (frontier.length) {
    d++;
    const next = [];
    for (const n of frontier) {
      for (const m of adj.get(n) ?? []) {
        if (m === to) return d;
        if (!seen.has(m)) { seen.add(m); next.push(m); }
      }
    }
    frontier = next;
  }
  return Infinity;
}

export function emptyBoard() {
  return { claims: new Set(), evidence: new Set(), inferred: [] };
}

export function fullBoard(c) {
  const b = { claims: new Set(c.claims.map((x) => x.id)), evidence: new Set(c.evidence.map((x) => x.id)), inferred: [] };
  eliminate(c, b);
  return b;
}

const hiddenDiscovered = (c, b) => c.evidence.some((e) => b.evidence.has(e.id) && e.revealsEdge);
const knowersOf = (c, b) => {
  const e = c.evidence.find((x) => b.evidence.has(x.id) && x.knowers);
  return e ? e.knowers : null;
};

export function assertions(c, b) {
  const out = [];
  for (const cl of c.claims) {
    if (!b.claims.has(cl.id)) continue;
    if (cl.kind === 'location' || cl.kind === 'saw') out.push({ subject: cl.subject, slot: cl.slot, room: cl.room, src: cl.id, hard: false, by: cl.by });
  }
  for (const e of c.evidence) {
    if (!b.evidence.has(e.id)) continue;
    for (const a of e.asserts ?? []) out.push({ subject: a.subject, slot: a.slot, room: a.room, src: e.id, hard: true });
  }
  for (const a of b.inferred) out.push({ ...a, hard: true });
  return out;
}

export function couldBeAt(c, b, person, slot, room) {
  const known = knowersOf(c, b);
  const hiddenOpen = hiddenDiscovered(c, b) && (!known || known.includes(person));
  const adj = graphFor(c, { hiddenOpen });
  const violations = [];
  if ((adj.get(room) ?? []).length === 0) violations.push({ reason: 'room not reachable for this person' });
  for (const a of assertions(c, b).filter((x) => x.hard && x.subject === person)) {
    const d = dist(adj, a.room, room);
    if (d > Math.abs(slot - a.slot)) violations.push({ anchor: a.src, slot: a.slot, room: a.room, needed: d, available: Math.abs(slot - a.slot) });
  }
  return { feasible: violations.length === 0, violations };
}

export function eliminate(c, b) {
  b.inferred = [];
  for (const e of c.evidence) {
    if (!b.evidence.has(e.id) || !e.act) continue;
    const survivors = e.act.restrictsTo.filter((p) => couldBeAt(c, b, p, e.act.slot, e.act.room).feasible);
    if (survivors.length === 1) b.inferred.push({ subject: survivors[0], slot: e.act.slot, room: e.act.room, src: `inferred:${e.id}` });
  }
}

export function whoCouldHave(c, b, evidenceId) {
  const e = c.evidence.find((x) => x.id === evidenceId);
  if (!e?.act) return null;
  return e.act.restrictsTo.map((p) => ({ person: p, ...couldBeAt(c, b, p, e.act.slot, e.act.room) }));
}

export function findContradictions(c, b) {
  const a = assertions(c, b);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const x = a[i], y = a[j];
      if (x.subject !== y.subject || x.slot !== y.slot || x.room === y.room || x.src === y.src) continue;
      const key = [x.src, y.src].sort().join('|');
      if (!seen.has(key)) { seen.add(key); out.push([x.src, y.src].sort()); }
    }
  }
  return out;
}

export function findRehearsed(c, b) {
  const groups = new Map();
  for (const cl of c.claims) {
    if (!b.claims.has(cl.id) || cl.kind !== 'location' || !cl.detail) continue;
    const k = `${cl.slot}|${cl.room}|${cl.detail}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(cl);
  }
  return [...groups.values()].filter((g) => new Set(g.map((x) => x.by)).size >= 2).map((g) => g.map((x) => x.id).sort());
}

export function findImpossibleMoves(c, b) {
  const adj = graphFor(c, { hiddenOpen: hiddenDiscovered(c, b) });
  const a = assertions(c, b);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length; j++) {
      const x = a[i], y = a[j];
      if (x.subject !== y.subject || x.slot >= y.slot || x.src === y.src) continue;
      if (dist(adj, x.room, y.room) > y.slot - x.slot) {
        const key = [x.src, y.src].join('|');
        if (!seen.has(key)) { seen.add(key); out.push({ person: x.subject, from: x.src, to: y.src, needed: dist(adj, x.room, y.room), available: y.slot - x.slot }); }
      }
    }
  }
  return out;
}

export function alibiSupport(c, b, person, slot) {
  const claimed = c.claims.find((x) => b.claims.has(x.id) && x.kind === 'location' && x.by === person && x.slot === slot);
  if (!claimed) return { claimed: null, supporters: [], supported: false };
  const hard = assertions(c, b).filter((x) => x.hard);
  const supporters = c.claims
    .filter((x) => b.claims.has(x.id) && x.kind === 'saw' && x.subject === person && x.slot === slot && x.room === claimed.room)
    .map((x) => ({ by: x.by, claim: x.id, reliable: !hard.some((h) => h.subject === x.by && h.slot === slot && h.room !== x.room) }));
  return { claimed: claimed.room, supporters, supported: supporters.some((s) => s.reliable) };
}

export function knownRelations(c, b) {
  const ids = new Set();
  for (const cl of c.claims) if (b.claims.has(cl.id) && cl.relation) ids.add(cl.relation);
  for (const e of c.evidence) if (b.evidence.has(e.id) && e.relation) ids.add(e.relation);
  return c.relations.filter((r) => ids.has(r.id));
}

export function motivePath(c, b, person, maxHops = 3) {
  const victim = c.people.find((p) => p.victim).id;
  const rels = knownRelations(c, b);
  const adj = new Map();
  for (const r of rels) {
    for (const [x, y] of [[r.from, r.to], [r.to, r.from]]) {
      if (!adj.has(x)) adj.set(x, []);
      adj.get(x).push({ to: y, rel: r.id });
    }
  }
  const queue = [{ node: person, path: [] }];
  const seen = new Set([person]);
  while (queue.length) {
    const { node, path } = queue.shift();
    if (node === victim) return path;
    if (path.length >= maxHops) continue;
    for (const n of adj.get(node) ?? []) {
      if (!seen.has(n.to)) { seen.add(n.to); queue.push({ node: n.to, path: [...path, n.rel] }); }
    }
  }
  return null;
}

export function evaluateBait(c, baitId) {
  const bait = c.baits.find((x) => x.id === baitId);
  const fact = c.facts.find((f) => f.id === bait.fact);
  const k = fact.knownBy;
  return { sharp: k.length === 1, reactors: k, outcome: k.length === 1 ? 'slip' : k.length === 0 ? 'nothing' : 'ambiguous' };
}

export function windowFor(c, b) {
  let w = null;
  for (const e of c.evidence) if (b.evidence.has(e.id) && e.window) {
    if (e.windowKind === 'revises') return e.window;
    w = w ?? e.window;
  }
  return w ?? c.publicWindow ?? null;
}
