// validate-cases.mjs  — run: node scripts/validate-cases.mjs [cases/dir]
// Proves each case is internally consistent, fair-play solvable, and has exactly the intended culprits.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as R from './reference-engine.mjs';

const dir = process.argv[2] ?? 'cases';
let totalErrors = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.run.json')).sort()) {
  const c = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const errs = [];
  const warn = [];
  const err = (m) => errs.push(m);

  // ---- 1. structure -------------------------------------------------------
  const ids = (arr) => arr.map((x) => x.id);
  for (const [name, arr] of [['rooms', c.rooms], ['people', c.people], ['claims', c.claims], ['evidence', c.evidence], ['relations', c.relations], ['facts', c.facts], ['baits', c.baits]]) {
    const s = new Set(ids(arr));
    if (s.size !== arr.length) err(`duplicate ids in ${name}`);
  }
  const rooms = new Set(ids(c.rooms));
  const people = new Set(ids(c.people));
  const victim = c.people.filter((p) => p.victim);
  if (victim.length !== 1) err('exactly one victim required');
  const suspects = c.people.filter((p) => !p.victim).map((p) => p.id);
  if (c.slots.length !== 8) err('slots must be 8');
  for (const e of c.edges) if (!rooms.has(e.a) || !rooms.has(e.b)) err(`edge uses unknown room ${e.a}-${e.b}`);
  for (const [p, row] of Object.entries(c.truth.presence)) {
    if (!people.has(p)) err(`presence for unknown person ${p}`);
    if (row.length !== 8 || row.some((r) => !rooms.has(r))) err(`bad presence row for ${p}`);
  }
  for (const p of c.people) if (!c.truth.presence[p.id]) err(`no presence row for ${p.id}`);
  const relIds = new Set(ids(c.relations));
  const evIds = new Set(ids(c.evidence));
  const claimIds = new Set(ids(c.claims));
  for (const cl of c.claims) {
    if (!people.has(cl.by)) err(`claim ${cl.id}: unknown by`);
    if ((cl.kind === 'location' || cl.kind === 'saw') && (!people.has(cl.subject) || !rooms.has(cl.room) || !(cl.slot >= 1 && cl.slot <= 8))) err(`claim ${cl.id}: bad subject/room/slot`);
    if (cl.relation && !relIds.has(cl.relation)) err(`claim ${cl.id}: unknown relation`);
    if ((cl.kind === 'fact' || cl.kind === 'relation') && typeof cl.truth !== 'boolean') err(`claim ${cl.id}: fact/relation needs boolean truth`);
    for (const r of cl.requires ?? []) if (!evIds.has(r)) err(`claim ${cl.id}: requires unknown evidence ${r}`);
  }
  for (const e of c.evidence) {
    if (!rooms.has(e.room)) err(`evidence ${e.id}: unknown room`);
    if (e.relation && !relIds.has(e.relation)) err(`evidence ${e.id}: unknown relation`);
  }
  for (const b of c.baits) if (!c.facts.some((f) => f.id === b.fact)) err(`bait ${b.id}: unknown fact`);
  for (const t of c.tells ?? []) if (!claimIds.has(t.claim)) err(`tell for unknown claim ${t.claim}`);
  for (const e of c.edges.filter((x) => x.state === 'hidden')) if (!evIds.has(e.discoveredBy)) err('hidden edge needs a discoverable evidence');

  // ---- 2. truth feasibility (movement on the TRUE map: locked doors and hidden passages usable) ----
  const trueAdj = R.graphFor(c, { lockedOpen: true, hiddenOpen: true });
  for (const [p, row] of Object.entries(c.truth.presence)) {
    for (let i = 1; i < 8; i++) {
      const d = R.dist(trueAdj, row[i - 1], row[i]);
      if (d > 1) err(`truth movement impossible: ${p} ${row[i - 1]} -> ${row[i]} between slots ${i} and ${i + 1}`);
    }
  }

  // ---- 3. truth values of claims and evidence ------------------------------
  let lies = 0;
  const falseLoc = [];
  for (const cl of c.claims) {
    if (cl.kind === 'location' || cl.kind === 'saw') {
      const t = c.truth.presence[cl.subject][cl.slot - 1] === cl.room;
      cl._true = t;
      if (!t) { lies++; falseLoc.push(cl.id); }
      if (cl.kind === 'location' && cl.by !== cl.subject) err(`claim ${cl.id}: location claims must be about the speaker`);
      if (cl.kind === 'saw' && cl.by === cl.subject) err(`claim ${cl.id}: saw claims must be about someone else`);
    } else cl._true = cl.truth;
  }
  for (const e of c.evidence) for (const a of e.asserts ?? []) {
    if (c.truth.presence[a.subject][a.slot - 1] !== a.room) err(`evidence ${e.id} asserts something false: ${a.subject}@${a.slot}=${a.room}`);
  }

  // ---- 4. the murder and exactly who is guilty -----------------------------
  const m = c.truth.murder;
  const vId = victim[0].id;
  if (c.truth.presence[vId][m.slot - 1] !== m.room) err('victim not in murder room at murder slot');
  const hands = suspects.filter((p) => c.truth.presence[p][m.slot - 1] === m.room);
  const planners = c.relations.filter((r) => r.type === 'COERCES' && hands.includes(r.to)).map((r) => r.from);
  const derived = new Set([...hands, ...planners].filter((p) => c.truth.motive[p]));
  const wanted = new Set(c.truth.culprits);
  if (derived.size !== wanted.size || [...wanted].some((p) => !derived.has(p))) err(`culprits mismatch: derived [${[...derived]}] vs declared [${[...wanted]}]`);
  if (JSON.stringify([...c.solution.culprits].sort()) !== JSON.stringify([...wanted].sort())) err('solution.culprits differs from truth.culprits');

  // ---- 5. full-knowledge board derivations --------------------------------
  const full = R.fullBoard(c);
  const contr = R.findContradictions(c, full).map((p) => p.join('|'));
  const same = (a, b) => [a, b].sort().join('|');
  for (const [a, b] of c.solution.proof.contradictions) if (!contr.includes(same(a, b))) err(`proof contradiction not derivable: ${a} vs ${b}`);
  const reh = R.findRehearsed(c, full).map((g) => g.join('|'));
  for (const g of c.solution.proof.rehearsed) if (!reh.includes([...g].sort().join('|'))) err(`rehearsed group not derivable: ${g}`);
  if (!c.solution.proof.rehearsed.length && reh.length) warn.push(`unexpected rehearsed groups: ${reh.join(' ; ')}`);
  const imp = R.findImpossibleMoves(c, full);
  for (const x of c.solution.proof.impossible) {
    if (!imp.some((i) => i.person === x.person && ((i.from === x.claims[0] && i.to === x.claims[1]) || (i.from === x.claims[1] && i.to === x.claims[0])))) err(`impossible move not derivable for ${x.person}`);
  }
  for (const x of c.solution.proof.eliminations) {
    const res = R.whoCouldHave(c, full, x.evidence).filter((r) => r.feasible).map((r) => r.person);
    if (res.length !== 1 || res[0] !== x.survivor) err(`elimination via ${x.evidence} leaves [${res}] not [${x.survivor}]`);
  }
  // baits: exactly the declared sharp baits are sharp and unique to the declared person
  const sharp = c.baits.filter((b) => R.evaluateBait(c, b.id).sharp).map((b) => `${b.id}:${R.evaluateBait(c, b.id).reactors[0]}`).sort();
  const wantSharp = c.solution.proof.sharpBaits.map((x) => `${x.bait}:${x.person}`).sort();
  if (JSON.stringify(sharp) !== JSON.stringify(wantSharp)) err(`sharp baits [${sharp}] differ from solution [${wantSharp}]`);
  for (const s of c.solution.proof.sharpBaits) if (!wanted.has(s.person)) err(`sharp bait ${s.bait} exposes a non-culprit`);
  if (c.baits.length && (c.baitsAllowed ?? 0) < wantSharp.length) err('baitsAllowed is smaller than the number of sharp baits needed');
  const truthKnown = new Set(c.facts.flatMap((f) => f.knownBy));
  for (const p of truthKnown) if (!people.has(p)) err(`fact knownBy unknown person ${p}`);

  // ---- 6. everybody is either a culprit or provably cleared ---------------
  const finalWindow = R.windowFor(c, full);
  if (JSON.stringify(finalWindow) !== JSON.stringify(c.solution.windowFinal)) err(`final window [${finalWindow}] differs from solution [${c.solution.windowFinal}]`);
  if (JSON.stringify(finalWindow) !== JSON.stringify([m.slot])) err('final window must equal the true murder slot');
  for (const p of suspects) {
    const res = R.couldBeAt(c, full, p, m.slot, m.room);
    if (hands.includes(p)) { if (!res.feasible) err(`hand ${p} is infeasible on the full board`); continue; }
    if (wanted.has(p)) { // a planner who was not in the room: must be provably away from the murder room at the time
      if (res.feasible) warn.push(`planner ${p} could not be proven away from the murder room`);
      continue;
    }
    const cl = c.solution.cleared[p];
    if (!cl) { err(`suspect ${p} is neither culprit nor listed as cleared`); continue; }
    if (res.feasible) err(`suspect ${p} is NOT provably cleared on the full board`);
    for (const a of cl.anchors) if (!evIds.has(a)) err(`cleared anchor ${a} unknown`);
  }
  // L2 specific: the initial window (from the watch) must differ from the final one, so the wrong-time trap is real
  const initialBoard = { claims: new Set(), evidence: new Set(c.evidence.filter((e) => e.window && e.windowKind === 'suggests').map((e) => e.id)), inferred: [] };
  const hasSuggestion = c.evidence.some((e) => e.window && e.windowKind === 'suggests');
  const initialWindow = hasSuggestion ? R.windowFor(c, initialBoard) : null;
  if (initialWindow && JSON.stringify(initialWindow) === JSON.stringify(c.solution.windowFinal)) err('initial window equals final window; the trap is not a trap');

  // ---- 7. motives for culprits -------------------------------------------
  for (const [p, r] of Object.entries(c.solution.motive)) {
    if (!relIds.has(r)) err(`motive relation ${r} unknown`);
    const path = R.motivePath(c, full, p);
    if (!path) err(`no motive path from ${p} to the victim on the full board`);
  }

  // ---- 8. lies must be detectable (fair play) ------------------------------
  const flagged = new Set();
  for (const [a, b] of R.findContradictions(c, full)) { flagged.add(a); flagged.add(b); }
  for (const g of R.findRehearsed(c, full)) g.forEach((x) => flagged.add(x));
  for (const i of imp) { flagged.add(i.from); flagged.add(i.to); }
  for (const id of falseLoc) if (!flagged.has(id)) err(`false claim ${id} is never exposed (unfair)`);
  for (const cl of c.claims.filter((x) => x.kind === 'fact' && x.truth === false)) {
    // false fact claims are exposed by evidence or by a bait; list them for the author
    warn.push(`false fact claim ${cl.id} has no automatic detection (flag for the UI: show as 'unverified')`);
  }
  // claims gated by evidence must be reachable
  for (const cl of c.claims.filter((x) => x.requires)) for (const r of cl.requires) {
    const e = c.evidence.find((x) => x.id === r);
    if (!e) err(`claim ${cl.id} requires missing ${r}`);
  }

  // ---- report -------------------------------------------------------------
  const stats = `${c.claims.length} claims (${lies} false location/sighting claims), ${c.evidence.length} evidence, ${c.people.length - 1} suspects, ${contr.length} contradictions, ${imp.length} impossible moves, ${reh.length} rehearsed groups`;
  console.log(`${errs.length ? 'FAIL' : 'PASS'}  ${c.id}  — ${stats}`);
  for (const e of errs) console.log(`   ERROR  ${e}`);
  for (const w of warn) console.log(`   note   ${w}`);
  totalErrors += errs.length;
}
if (totalErrors) { console.log(`\n${totalErrors} error(s)`); process.exit(1); }
console.log('\nAll cases valid.');
