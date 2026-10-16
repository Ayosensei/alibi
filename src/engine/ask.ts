import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ACTIONS, type Envelope, type TraceStepType } from './contract';
import { CaseSchema } from './schema';
import { run, ro, graphExists } from './db';
import { incrementTick } from './play';
import { validateFirewall, type FirewallResult } from './firewall';
import { callSuspectLLM } from './llm';
import {
  buildForbiddenKeywords,
  buildSuspectPrompt,
  getBrushOff,
  type SuspectClaim,
} from './suspect';
import {
  Q40_select_claims,
  Q41_asked_claims,
  Q42_found_evidence,
  Q43_add_statement,
  Q44_add_assertion,
  Q45_reveal_relation,
} from './queries';

export type AskInput = z.input<typeof ACTIONS.ask.input>;
export type AskOutput = z.infer<typeof ACTIONS.ask.output>;

export async function ask(input: AskInput): Promise<Envelope<AskOutput>> {
  const trace: TraceStepType[] = [];
  const parsed = ACTIONS.ask.input.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'BAD_ARGS', message: 'Invalid arguments for ask' },
      trace,
    };
  }

  const { playerId, caseId, suspectId, topic, slot, about } = parsed.data;
  const playGraph = `play:${playerId}:${caseId}`;
  const truthGraph = `truth:${caseId}`;

  const casePath = join(process.cwd(), 'cases', `${caseId}.json`);
  if (!existsSync(casePath)) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_CASE', message: `Unknown case: ${caseId}` },
      trace,
    };
  }

  const exists = await graphExists(playGraph);
  if (!exists) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PLAY', message: `No active play session for ${playerId}` },
      trace,
    };
  }

  const caseData = CaseSchema.parse(JSON.parse(readFileSync(casePath, 'utf8')));
  const suspect = caseData.people.find((p) => p.id === suspectId);
  if (!suspect) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_PERSON', message: `Unknown suspect: ${suspectId}` },
      trace,
    };
  }

  // Read asked claim IDs and found evidence IDs from play graph
  const askedRes = await ro<{ id: string }>({
    graphName: playGraph,
    query: Q41_asked_claims,
    traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q41_asked_claims' },
  });
  if (askedRes.step) trace.push(askedRes.step);
  const askedClaimIds = askedRes.data.map((r) => r.id);

  const foundRes = await ro<{ id: string }>({
    graphName: playGraph,
    query: Q42_found_evidence,
    traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q42_found_evidence' },
  });
  if (foundRes.step) trace.push(foundRes.step);
  const foundEvidenceIds = foundRes.data.map((r) => r.id);

  // Query up to 2 claims from truth graph
  const selectRes = await ro<SuspectClaim>({
    graphName: truthGraph,
    query: Q40_select_claims,
    params: {
      suspect: suspectId,
      topic,
      slot: slot ?? 0,
      about: about ?? '',
      askedClaimIds,
      foundEvidenceIds,
    },
    traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q40_select_claims' },
  });
  if (selectRes.step) trace.push(selectRes.step);

  const selectedClaims = selectRes.data;

  // 1. None left -> status 'nothing_new'
  if (selectedClaims.length === 0) {
    const brushOff = getBrushOff(suspect.name, suspect.persona ?? '');
    return {
      ok: true,
      data: {
        reply: brushOff,
        source: 'template_fallback',
        firewall: { passed: true, violations: [] },
        newStatements: [],
        observation: null,
        status: 'nothing_new',
      },
      trace,
    };
  }

  // Advance game tick
  const newTick = await incrementTick(playerId, caseId);

  // 2. Observations (tells)
  const allowedClaimIds = selectedClaims.map((c) => c.id);
  const matchedTell = caseData.tells?.find((t) => allowedClaimIds.includes(t.claim));
  const observation = matchedTell ? matchedTell.text : null;

  // 3. Prepare fallback template reply
  const templateReply = selectedClaims.map((c) => c.text).join(' ');
  let reply = templateReply;
  let source: 'llm' | 'template_fallback' = 'template_fallback';
  let firewallResult: FirewallResult = { passed: true, violations: [] };

  // 4. LLM reply generation with firewall validation
  const questionContext = [topic, slot ? `slot ${slot}` : '', about ?? ''].filter(Boolean).join(' ');
  const forbiddenKeywords = buildForbiddenKeywords(
    caseData,
    selectedClaims,
    questionContext,
    suspectId
  );

  const victim = caseData.people.find((p) => p.victim);
  const victimName = victim?.name ?? 'the victim';

  const prompt = buildSuspectPrompt(
    suspect.name,
    suspect.role,
    suspect.persona ?? '',
    victimName,
    selectedClaims,
    false
  );

  const firstLlmRes = await callSuspectLLM({ prompt, isRetry: false });
  if (firstLlmRes) {
    const fwCheck1 = validateFirewall(
      firstLlmRes.reply,
      firstLlmRes.claimIds,
      allowedClaimIds,
      forbiddenKeywords
    );
    if (fwCheck1.passed) {
      reply = firstLlmRes.reply;
      source = 'llm';
      firewallResult = fwCheck1;
    } else {
      // Retry once with stricter instructions
      const retryPrompt = buildSuspectPrompt(
        suspect.name,
        suspect.role,
        suspect.persona ?? '',
        victimName,
        selectedClaims,
        true
      );
      const secondLlmRes = await callSuspectLLM({ prompt: retryPrompt, isRetry: true });
      if (secondLlmRes) {
        const fwCheck2 = validateFirewall(
          secondLlmRes.reply,
          secondLlmRes.claimIds,
          allowedClaimIds,
          forbiddenKeywords
        );
        if (fwCheck2.passed) {
          reply = secondLlmRes.reply;
          source = 'llm';
          firewallResult = fwCheck2;
        } else {
          // Fall back to authored claim text
          reply = templateReply;
          source = 'template_fallback';
          firewallResult = fwCheck2;
        }
      } else {
        reply = templateReply;
        source = 'template_fallback';
        firewallResult = fwCheck1;
      }
    }
  }

  // 5. Write statements, assertions, and revealed relations to play graph
  const newStatements: AskOutput['newStatements'] = [];

  for (const cl of selectedClaims) {
    const sid = `stmt_${cl.id}`;
    const addStmtRes = await run({
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
        tick: newTick,
      },
      traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q43_add_statement' },
    });
    if (addStmtRes.step) trace.push(addStmtRes.step);

    // If location or saw, attach soft assertion
    if (cl.kind === 'location' || cl.kind === 'saw') {
      const aid = `ass_${cl.id}`;
      const addAssRes = await run({
        graphName: playGraph,
        query: Q44_add_assertion,
        params: {
          sid,
          aid,
          cid: cl.id,
          subject: cl.subject,
          slot: cl.slot,
          room: cl.room,
        },
        traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q44_add_assertion' },
      });
      if (addAssRes.step) trace.push(addAssRes.step);
    }

    // If relation revealed, add relation edge
    if (cl.relationId) {
      const rel = caseData.relations.find((r) => r.id === cl.relationId);
      if (rel) {
        const relRes = await run({
          graphName: playGraph,
          query: Q45_reveal_relation,
          params: {
            from: rel.from,
            to: rel.to,
            rid: rel.id,
            type: rel.type,
            text: rel.text,
          },
          traceCtx: { agent: 'suspect', tool: 'ask', queryId: 'Q45_reveal_relation' },
        });
        if (relRes.step) trace.push(relRes.step);
      }
    }

    newStatements.push({
      id: sid,
      claimId: cl.id,
      by: cl.by,
      kind: cl.kind,
      subject: cl.subject && cl.subject !== '' ? cl.subject : undefined,
      slot: cl.slot && cl.slot > 0 ? cl.slot : undefined,
      room: cl.room && cl.room !== '' ? cl.room : undefined,
      text: cl.text,
    });
  }

  return {
    ok: true,
    data: {
      reply,
      source,
      firewall: firewallResult,
      newStatements,
      observation,
      status: 'answered',
    },
    trace,
  };
}
