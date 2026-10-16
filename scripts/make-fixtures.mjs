// make-fixtures.mjs — run: node scripts/make-fixtures.mjs
// Generates, from the ORACLE, (1) golden tool outputs per case (fixtures/<case>.oracle.json), used as expected values
// in parity tests AND as mock API data for the UI, and (2) recorded cold-case runs (cases/<case>.run.json).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as R from './reference-engine.mjs';

mkdirSync('fixtures', { recursive: true });

// Which statements and evidence are pre-loaded on the cold-case board (everything the player *could* have gathered).
const COLD = {
  'l1-quiet-pact': { evidence: ['e1_doorlog', 'e1_till', 'e1_lamp'], claimsExcluding: [] },
  'l2-stopped-watch': { evidence: ['e2_watch', 'e2_coroner', 'e2_cabinetlog', 'e2_tab', 'e2_gate', 'e2_vaultlog', 'e2_provenance'], claimsExcluding: [] },
  'l3-blackout-dinner': { evidence: ['e3_studylock', 'e3_wifi', 'e3_recording', 'e3_meter', 'e3_hinge', 'e3_libdoor', 'e3_message', 'e3_plan', 'e3_ledger', 'e3_alarm'], claimsExcluding: [] },
};

const boardOf = (c, evidence, claimIds) => {
  const b = { claims: new Set(claimIds), evidence: new Set(evidence), inferred: [] };
  R.eliminate(c, b);
  return b;
};

for (const file of readdirSync('cases').filter((f) => f.endsWith('.json') && !f.endsWith('.run.json')).sort()) {
  const c = JSON.parse(readFileSync(`cases/${file}`, 'utf8'));
  const victim = c.people.find((p) => p.victim).id;
  const suspects = c.people.filter((p) => !p.victim).map((p) => p.id);
  const cfg = COLD[c.id];
  // claims whose `requires` are all satisfied by the pre-loaded evidence
  const claimIds = c.claims.filter((x) => !(cfg.claimsExcluding ?? []).includes(x.id) && (x.requires ?? []).every((r) => cfg.evidence.includes(r))).map((x) => x.id);
  const b = boardOf(c, cfg.evidence, claimIds);
  const window = R.windowFor(c, b);
  const slot = window[0];
  const scene = c.truth.murder.room;

  const out = {
    caseId: c.id, window, crimeScene: scene,
    contradictions: R.findContradictions(c, b),
    rehearsed: R.findRehearsed(c, b),
    impossible: R.findImpossibleMoves(c, b).map(({ person, from, to, needed, available }) => ({ person, from, to, needed, available })),
    feasibility: Object.fromEntries(suspects.map((p) => [p, R.couldBeAt(c, b, p, slot, scene).feasible])),
    acts: Object.fromEntries(c.evidence.filter((e) => e.act && cfg.evidence.includes(e.id)).map((e) => [e.id, R.whoCouldHave(c, b, e.id).filter((x) => x.feasible).map((x) => x.person)])),
    inferred: b.inferred,
    alibiSupport: {},
    motivePaths: Object.fromEntries(suspects.map((p) => [p, R.motivePath(c, b, p)])),
  };
  for (const p of suspects) for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const a = R.alibiSupport(c, b, p, s);
    if (a.claimed && a.supporters.length) out.alibiSupport[`${p}@${s}`] = a;
  }
  writeFileSync(`fixtures/${c.id}.oracle.json`, JSON.stringify(out, null, 2));

  // ---- recorded cold-case run: the deterministic Inspector plan ----
  const steps = [];
  const say = (tool, args, text) => steps.push({ tool, args, say: text });
  say('getBoard', {}, 'Let me see what the Consultant has gathered so far.');
  say('findContradictions', {}, `Looking for statements that cannot both be true. I find ${out.contradictions.length}.`);
  say('findRehearsedAlibis', {}, out.rehearsed.length ? 'Some alibis share identical details. That is rehearsal, not memory.' : 'No identical details across suspects.');
  say('findImpossibleMoves', {}, out.impossible.length ? `${out.impossible.length} placements need faster travel than the map allows.` : 'Nobody has to teleport.');
  for (const e of c.evidence.filter((x) => x.act && cfg.evidence.includes(x.id))) say('whoCouldHave', { evidenceId: e.id }, `Who could have done what "${e.title}" records? Checking each candidate against the map and the hard evidence.`);
  for (const p of suspects) say('checkFeasibility', { person: p, slot, room: scene }, `Could ${c.people.find((x) => x.id === p).name} have been in the crime scene at the window slot?`);
  for (const key of Object.keys(out.alibiSupport)) {
    const [p, s] = key.split('@');
    if (Number(s) === slot || (c.id.startsWith('l3') && Number(s) === 4)) say('alibiSupport', { person: p, slot: Number(s) }, `Who vouches for ${c.people.find((x) => x.id === p).name} at slot ${s}, and can they be trusted?`);
  }
  const suspects2 = suspects.filter((p) => out.feasibility[p] || c.truth.culprits.includes(p));
  for (const p of suspects2) say('motivePaths', { person: p }, `Does ${c.people.find((x) => x.id === p).name} have a known path to ${c.people.find((x) => x.id === victim).name}?`);
  writeFileSync(`cases/${c.id}.run.json`, JSON.stringify({ caseId: c.id, label: 'Recorded run, re-executed live against the graph', board: { claims: claimIds, evidence: cfg.evidence }, steps, expect: out }, null, 2));
  console.log(`${c.id}: ${steps.length} steps, contradictions ${out.contradictions.length}, feasible suspects [${suspects.filter((p) => out.feasibility[p])}]`);
}
