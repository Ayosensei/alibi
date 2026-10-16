import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  TOOLS,
  InspectorEvent,
  type InspectorEventType,
  type Envelope,
} from './contract';
import { CaseSchema, type CaseType } from './schema';
import { graphExists, run } from './db';
import { startPlay } from './play';
import { getBoard } from './board';
import {
  findContradictions,
  findRehearsedAlibis,
  findImpossibleMoves,
} from './reasoning';
import { checkFeasibility, whoCouldHave } from './feasibility';
import { motivePaths, alibiSupport } from './investigation';
import { flag, hypothesize } from './notes';
import { eliminate } from './search';
import {
  Q43_add_statement,
  Q44_add_assertion,
  Q45_reveal_relation,
  Q51_add_evidence,
  Q52_add_ev_assertion,
  Q53_reveal_edge,
  Q54_set_knowers,
} from './queries';

export type ToolFn = (input: any) => Promise<Envelope<any>>;

export const TOOL_DISPATCH: Record<keyof typeof TOOLS, ToolFn> = {
  getBoard,
  findContradictions,
  findRehearsedAlibis,
  findImpossibleMoves,
  checkFeasibility,
  whoCouldHave,
  motivePaths,
  alibiSupport,
  flag,
  hypothesize,
};

export function formatToolResult(
  tool: string,
  data: any,
  args: any
): { summary: string; rows: number; highlight: string[] } {
  switch (tool) {
    case 'getBoard':
      return {
        summary: `Board has ${data?.statements?.length ?? 0} statements and ${data?.evidence?.length ?? 0} evidence items.`,
        rows: (data?.statements?.length ?? 0) + (data?.evidence?.length ?? 0),
        highlight: [],
      };
    case 'findContradictions':
      return {
        summary: `Found ${data?.pairs?.length ?? 0} contradictions.`,
        rows: data?.pairs?.length ?? 0,
        highlight: (data?.pairs ?? []).flatMap((c: any) => [c.a?.src, c.b?.src].filter(Boolean)),
      };
    case 'findRehearsedAlibis':
      return {
        summary: `Found ${data?.groups?.length ?? 0} rehearsed alibi groups.`,
        rows: data?.groups?.length ?? 0,
        highlight: (data?.groups ?? []).flatMap((g: any) => g.claimIds ?? []),
      };
    case 'findImpossibleMoves':
      return {
        summary: `Found ${data?.moves?.length ?? 0} impossible moves.`,
        rows: data?.moves?.length ?? 0,
        highlight: (data?.moves ?? []).flatMap((m: any) => [m.from?.src, m.to?.src].filter(Boolean)),
      };
    case 'checkFeasibility':
      return {
        summary: `${args?.person} at slot ${args?.slot} in ${args?.room}: ${data?.feasible ? 'feasible' : 'infeasible'}.`,
        rows: data?.violations?.length ?? 0,
        highlight: (data?.violations ?? []).map((v: any) => v.anchor).filter(Boolean),
      };
    case 'whoCouldHave':
      return {
        summary: `Evaluated candidates for ${args?.evidenceId}: ${data?.candidates?.filter((c: any) => c.feasible).map((c: any) => c.person).join(', ') || 'none'}.`,
        rows: data?.candidates?.length ?? 0,
        highlight: (data?.candidates ?? []).filter((c: any) => c.feasible).map((c: any) => c.person),
      };
    case 'motivePaths':
      return {
        summary: `Found ${data?.paths?.length ?? 0} motive paths for ${args?.person}.`,
        rows: data?.paths?.length ?? 0,
        highlight: (data?.paths ?? []).flatMap((p: any) => p.relationIds ?? []),
      };
    case 'alibiSupport':
      return {
        summary: `${args?.person} at slot ${args?.slot}: ${data?.supported ? 'supported' : 'unsupported'}.`,
        rows: data?.supporters?.length ?? 0,
        highlight: (data?.supporters ?? []).map((s: any) => s.claimId ?? s.claim).filter(Boolean),
      };
    case 'flag':
      return {
        summary: `Created flag ${data?.flagId}.`,
        rows: 1,
        highlight: args?.refs ?? [],
      };
    case 'hypothesize':
      return {
        summary: `Created hypothesis ${data?.hypothesisId}.`,
        rows: 1,
        highlight: args?.supportedBy ?? [],
      };
    default:
      return {
        summary: `Executed ${tool}.`,
        rows: 0,
        highlight: [],
      };
  }
}

export async function loadColdBoard(
  playerId: string,
  caseId: string,
  board: { claims: string[]; evidence: string[] }
): Promise<void> {
  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));
  const playGraph = `play:${playerId}:${caseId}`;

  // Reset to initial graph
  await startPlay({ playerId, caseId, reset: true });

  // 1. Evidence
  for (const eid of board.evidence) {
    const ev = caseData.evidence.find((e) => e.id === eid);
    if (!ev) continue;

    await run({
      graphName: playGraph,
      query: Q51_add_evidence,
      params: {
        id: ev.id,
        room: ev.room,
        title: ev.title,
        text: ev.text,
        window: ev.window ?? [],
        windowKind: ev.windowKind ?? '',
        actSlot: ev.act?.slot ?? 0,
        actRoom: ev.act?.room ?? '',
        actRestrictsTo: ev.act?.restrictsTo ?? [],
        relationId: ev.relation ?? '',
        revealsEdge: ev.revealsEdge ?? '',
        knowers: ev.knowers ?? [],
      },
      traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q51_add_evidence' },
    });

    if (ev.asserts) {
      for (let i = 0; i < ev.asserts.length; i++) {
        const a = ev.asserts[i];
        await run({
          graphName: playGraph,
          query: Q52_add_ev_assertion,
          params: {
            eid: ev.id,
            aid: `assert_${ev.id}_${i}`,
            subject: a.subject,
            slot: a.slot,
            room: a.room,
          },
          traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q52_add_ev_assertion' },
        });
      }
    }

    if (ev.revealsEdge) {
      const [from, to] = ev.revealsEdge.split('-');
      await run({
        graphName: playGraph,
        query: Q53_reveal_edge,
        params: { a: from, b: to, knowers: ev.knowers ?? [] },
        traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q53_reveal_edge' },
      });
    }

    if (ev.knowers && ev.knowers.length > 0) {
      await run({
        graphName: playGraph,
        query: Q54_set_knowers,
        params: { knowers: ev.knowers },
        traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q54_set_knowers' },
      });
    }

    if (ev.relation) {
      const rel = caseData.relations.find((r) => r.id === ev.relation);
      if (rel) {
        await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: {
            from: rel.from,
            to: rel.to,
            rid: rel.id,
            type: rel.type,
            text: rel.text,
          },
          traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q45_reveal_relation' },
        });
      }
    }
  }

  // 2. Claims
  for (const cid of board.claims) {
    const cl = caseData.claims.find((c) => c.id === cid);
    if (!cl) continue;

    const sid = `stmt_${cl.id}`;
    await run({
      graphName: playGraph,
      query: Q43_add_statement,
      params: {
        sid,
        cid: cl.id,
        by: cl.by,
        kind: cl.kind,
        subject: cl.subject ?? '',
        slot: cl.slot ?? 0,
        room: cl.room ?? '',
        detail: cl.detail ?? '',
        text: cl.text,
        tick: 0,
      },
      traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q43_add_statement' },
    });

    if ((cl.kind === 'location' || cl.kind === 'saw') && cl.subject && cl.slot && cl.room) {
      await run({
        graphName: playGraph,
        query: Q44_add_assertion,
        params: {
          sid,
          aid: `assert_${sid}`,
          cid: cl.id,
          subject: cl.subject,
          slot: cl.slot,
          room: cl.room,
        },
        traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q44_add_assertion' },
      });
    }

    if (cl.relation) {
      const rel = caseData.relations.find((r) => r.id === cl.relation);
      if (rel) {
        await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: {
            from: rel.from,
            to: rel.to,
            rid: rel.id,
            type: rel.type,
            text: rel.text,
          },
          traceCtx: { agent: 'engine', tool: 'loadColdBoard', queryId: 'Q45_reveal_relation' },
        });
      }
    }
  }

  // Run elimination
  await eliminate(playGraph, caseData);
}

export interface InspectorInput {
  playerId: string;
  caseId: string;
  mode: 'assist' | 'cold_case';
  question?: string;
}

export async function runInspector(
  input: InspectorInput,
  sendEvent: (event: InspectorEventType) => void
): Promise<void> {
  const { playerId, caseId, mode, question } = input;
  const playGraph = `play:${playerId}:${caseId}`;

  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  if (!existsSync(casePath)) {
    sendEvent({
      type: 'message',
      text: `Error: Unknown case ${caseId}.`,
    });
    sendEvent({ type: 'done', steps: 0, source: 'deterministic' });
    return;
  }

  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));

  if (mode === 'cold_case') {
    const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
    if (!existsSync(runPath)) {
      sendEvent({
        type: 'message',
        text: `Error: No recorded run found for ${caseId}.`,
      });
      sendEvent({ type: 'done', steps: 0, source: 'recorded' });
      return;
    }

    const runData = JSON.parse(readFileSync(runPath, 'utf8'));

    // Apply board through normal write path
    await loadColdBoard(playerId, caseId, runData.board);

    let stepCount = 0;
    for (const step of runData.steps) {
      const toolName = step.tool as keyof typeof TOOLS;
      const fn = TOOL_DISPATCH[toolName];
      if (!fn) continue;

      sendEvent({
        type: 'tool_call',
        tool: step.tool,
        args: step.args,
      });

      const t0 = Date.now();
      const res = await fn({ playerId, caseId, ...step.args });
      const ms = Date.now() - t0;
      stepCount++;

      const resData = res.ok ? res.data : undefined;
      const formatted = formatToolResult(step.tool, resData, step.args);
      sendEvent({
        type: 'tool_result',
        tool: step.tool,
        summary: formatted.summary,
        rows: formatted.rows,
        ms,
        highlight: formatted.highlight,
      });

      if (step.say) {
        sendEvent({
          type: 'message',
          text: step.say,
        });
      }
    }

    sendEvent({
      type: 'done',
      steps: stepCount,
      source: 'recorded',
    });
    return;
  }

  // mode === 'assist'
  // Deterministic fallback plan
  const exists = await graphExists(playGraph);
  if (!exists) {
    await startPlay({ playerId, caseId, reset: false });
  }

  let stepCount = 0;
  const callTool = async (
    toolName: keyof typeof TOOLS,
    args: any,
    force = false
  ): Promise<any> => {
    if (!force && stepCount >= 8) return null;
    const fn = TOOL_DISPATCH[toolName];
    if (!fn) return null;

    sendEvent({
      type: 'tool_call',
      tool: toolName,
      args,
    });

    const t0 = Date.now();
    const res = await fn({ playerId, caseId, ...args });
    const ms = Date.now() - t0;
    stepCount++;

    const resData = res.ok ? res.data : undefined;
    const formatted = formatToolResult(toolName, resData, args);
    sendEvent({
      type: 'tool_result',
      tool: toolName,
      summary: formatted.summary,
      rows: formatted.rows,
      ms,
      highlight: formatted.highlight,
    });

    if (res.ok) {
      if (toolName === 'flag' && res.data.flagId) {
        sendEvent({
          type: 'flag',
          flagId: res.data.flagId,
          kind: args.kind,
          note: args.note,
        });
      }

      if (toolName === 'hypothesize' && res.data.hypothesisId) {
        sendEvent({
          type: 'hypothesis',
          hypothesisId: res.data.hypothesisId,
          text: args.text,
          confidence: args.confidence,
        });
      }
    }

    return res.ok ? res.data : null;
  };

  // 1. getBoard
  const board = await callTool('getBoard', {});
  const windowSlots = board?.window ?? caseData.publicWindow ?? [caseData.truth.murder.slot];
  const windowSlot = windowSlots[0] ?? 1;
  const crimeScene = caseData.truth.murder.room;
  const suspects = caseData.people.filter((p) => !p.victim).map((p) => p.id);

  // 2. findContradictions
  const contradictionsData = await callTool('findContradictions', {});
  const contradictionPairs = contradictionsData?.pairs ?? [];
  for (const pair of contradictionPairs) {
    if (stepCount >= 8) break;
    const s1 = pair.a?.src;
    const s2 = pair.b?.src;
    if (s1 && s2) {
      await callTool('flag', {
        kind: 'contradiction',
        refs: [s1, s2],
        note: `Contradiction between ${s1} and ${s2}`,
        by: 'inspector',
      });
    }
  }

  // 3. findRehearsedAlibis
  if (stepCount < 8) {
    const rehearsedData = await callTool('findRehearsedAlibis', {});
    const groups = rehearsedData?.groups ?? [];
    for (const g of groups) {
      if (stepCount >= 8) break;
      const refs = g.claimIds ?? [];
      await callTool('flag', {
        kind: 'rehearsed',
        refs,
        note: `Rehearsed alibi: identical details across statements`,
        by: 'inspector',
      });
    }
  }

  // 4. findImpossibleMoves
  if (stepCount < 8) {
    const impossibleData = await callTool('findImpossibleMoves', {});
    const moves = impossibleData?.moves ?? [];
    for (const m of moves) {
      if (stepCount >= 8) break;
      await callTool('flag', {
        kind: 'impossible',
        refs: [m.from.src, m.to.src],
        note: `Impossible move for ${m.person}`,
        by: 'inspector',
      });
    }
  }

  // 5. checkFeasibility for suspects at window slot & scene
  const cleared: string[] = [];
  const feasibleSuspects: string[] = [];
  for (const p of suspects) {
    if (stepCount >= 8) break;
    const feas = await callTool('checkFeasibility', {
      person: p,
      slot: windowSlot,
      room: crimeScene,
    });
    if (feas && !feas.feasible) {
      cleared.push(p);
      const anchors = (feas.violations ?? []).map((v: any) => v.anchor).filter(Boolean);
      await callTool('flag', {
        kind: 'cleared',
        refs: anchors,
        note: `${p} is cleared from the crime scene at slot ${windowSlot}`,
        by: 'inspector',
      });
    } else if (feas && feas.feasible) {
      feasibleSuspects.push(p);
    }
  }

  // 6. whoCouldHave for acts
  const actEvidence = caseData.evidence.filter((e) => e.act && (board?.evidence ?? []).some((fe: any) => fe.id === e.id));
  for (const e of actEvidence) {
    if (stepCount >= 8) break;
    await callTool('whoCouldHave', { evidenceId: e.id });
  }

  // 7. alibiSupport
  for (const p of suspects) {
    if (stepCount >= 8) break;
    const locStmt = (board?.statements ?? []).find(
      (s: any) => s.by === p && s.kind === 'location' && s.slot === windowSlot
    );
    if (locStmt) {
      await callTool('alibiSupport', { person: p, slot: windowSlot });
    }
  }

  // 8. motivePaths for non-cleared
  const nonCleared = suspects.filter((p) => !cleared.includes(p));
  for (const p of nonCleared) {
    if (stepCount >= 8) break;
    await callTool('motivePaths', { person: p });
  }

  // Formulate hypothesis
  const primeSuspect = feasibleSuspects[0] ?? nonCleared[0] ?? suspects[0];
  const findingsCount = contradictionPairs.length + cleared.length;
  const confidence = Math.min(0.95, 0.35 + 0.15 * findingsCount);
  const hypothesisRefs = contradictionPairs.flatMap((c: any) => [c.a?.src, c.b?.src].filter(Boolean));

  await callTool(
    'hypothesize',
    {
      text: `Evidence and timeline suggest ${primeSuspect} had access to the crime scene during the murder window.`,
      person: primeSuspect,
      confidence,
      supportedBy: hypothesisRefs,
      by: 'inspector',
    },
    true
  );

  // Summary narration lines (3 to 6 sentences)
  const sentences = [
    `I have reviewed the evidence board and cross-referenced all suspect movements.`,
    `The murder window is confirmed at slot ${windowSlot} in the ${crimeScene}.`,
    contradictionPairs.length > 0
      ? `We have uncovered ${contradictionPairs.length} major contradiction(s) in the timeline.`
      : `Suspect statements currently show no blatant contradictions.`,
    cleared.length > 0
      ? `Hard anchors conclusively clear ${cleared.join(', ')} from the scene of the crime.`
      : `No suspects have been completely cleared by physical anchors yet.`,
    `Our prime line of inquiry focuses on ${feasibleSuspects.length > 0 ? feasibleSuspects.join(' and ') : 'unconfirmed whereabouts'}.`,
  ];

  sendEvent({
    type: 'message',
    text: sentences.join(' '),
  });

  sendEvent({
    type: 'done',
    steps: stepCount,
    source: 'deterministic',
  });
}
