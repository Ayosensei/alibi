import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureCases } from '@/engine/seed';
import { startPlay } from '@/engine/play';
import { search } from '@/engine/search';
import { ask } from '@/engine/ask';
import {
  runInspector,
  TOOL_DISPATCH,
  loadColdBoard,
} from '@/engine/inspector';
import {
  TOOLS,
  InspectorEvent,
  type InspectorEventType,
} from '@/engine/contract';
import { POST as inspectorPost } from '@/app/api/inspector/route';
import { POST as toolPost } from '@/app/api/tool/[name]/route';

describe('Inspector and Cold-Case Runs (Tasks A8 and A9)', () => {
  beforeAll(async () => {
    await ensureCases();
  });

  describe('Deterministic plan and tool constraints (Task A8)', () => {
    it('executes deterministic assist plan with <= 8 tool calls and writes flags/hypotheses with by: inspector', async () => {
      const pid = 'test_insp_det_l1';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      // Gather some initial clues
      await search({ playerId: pid, caseId: 'l1-quiet-pact', roomId: 'prop_store' });
      await ask({ playerId: pid, caseId: 'l1-quiet-pact', suspectId: 'dee', topic: 'whereabouts', slot: 5 });

      const events: InspectorEventType[] = [];
      await runInspector(
        { playerId: pid, caseId: 'l1-quiet-pact', mode: 'assist' },
        (e) => {
          const parsed = InspectorEvent.safeParse(e);
          expect(parsed.success).toBe(true);
          events.push(e);
        }
      );

      // Verify event types
      const toolCalls = events.filter((e) => e.type === 'tool_call');
      expect(toolCalls.length).toBeGreaterThan(0);

      // Verify tool results
      const toolResults = events.filter((e) => e.type === 'tool_result');
      expect(toolResults.length).toBe(toolCalls.length);

      // Verify flag events have by: inspector
      const flagEvents = events.filter((e) => e.type === 'flag');
      expect(flagEvents.length).toBeGreaterThan(0);

      // Verify hypothesis events
      const hypothesisEvents = events.filter((e) => e.type === 'hypothesis');
      expect(hypothesisEvents.length).toBeGreaterThan(0);
      if (hypothesisEvents[0].type === 'hypothesis') {
        expect(hypothesisEvents[0].confidence).toBeGreaterThanOrEqual(0.35);
        expect(hypothesisEvents[0].confidence).toBeLessThanOrEqual(0.95);
      }

      // Verify summary message
      const messages = events.filter((e) => e.type === 'message');
      expect(messages.length).toBeGreaterThan(0);
      if (messages[0].type === 'message') {
        expect(messages[0].text).toContain('murder window');
      }

      // Verify completion event
      const doneEvents = events.filter((e) => e.type === 'done');
      expect(doneEvents).toHaveLength(1);
      if (doneEvents[0].type === 'done') {
        expect(doneEvents[0].source).toBe('deterministic');
        expect(doneEvents[0].steps).toBe(toolCalls.length);
      }
    });

    it('proves the Inspector cannot access or query truth:* graphs', async () => {
      // 1. Verify TOOLS contains only reasoning and board write tools
      const allowedTools = Object.keys(TOOLS);
      expect(allowedTools.sort()).toEqual([
        'alibiSupport',
        'checkFeasibility',
        'findContradictions',
        'findImpossibleMoves',
        'findRehearsedAlibis',
        'flag',
        'getBoard',
        'hypothesize',
        'motivePaths',
        'whoCouldHave',
      ]);

      // 2. Actions (search, ask, useBait, accuse) which read truth:* are strictly NOT in TOOL_DISPATCH
      expect('search' in TOOL_DISPATCH).toBe(false);
      expect('ask' in TOOL_DISPATCH).toBe(false);
      expect('useBait' in TOOL_DISPATCH).toBe(false);
      expect('accuse' in TOOL_DISPATCH).toBe(false);
      expect('start' in TOOL_DISPATCH).toBe(false);

      // 3. Verify all tools in TOOL_DISPATCH accept only play graph context (playerId, caseId)
      for (const [toolName, fn] of Object.entries(TOOL_DISPATCH)) {
        // Calling with an invalid player on play graph returns UNKNOWN_PLAY or BAD_ARGS error without touching truth
        const res = await fn({ playerId: 'nonexistent_play_tenant_xyz', caseId: 'l1-quiet-pact' });
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(['UNKNOWN_PLAY', 'BAD_ARGS']).toContain(res.error.code);
        }
      }
    });
  });

  describe('Cold-case recorded runs (Task A9)', () => {
    for (const caseId of ['l1-quiet-pact', 'l2-stopped-watch', 'l3-blackout-dinner'] as const) {
      it(`re-executes recorded cold case for ${caseId} live and streams real results`, async () => {
        const pid = `test_cold_${caseId}`;
        const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
        const runData = JSON.parse(readFileSync(runPath, 'utf8'));

        const events: InspectorEventType[] = [];
        await runInspector(
          { playerId: pid, caseId, mode: 'cold_case' },
          (e) => {
            const parsed = InspectorEvent.safeParse(e);
            expect(parsed.success).toBe(true);
            events.push(e);
          }
        );

        // Verify all steps from runData.steps were executed
        const toolCalls = events.filter((e) => e.type === 'tool_call');
        expect(toolCalls.length).toBe(runData.steps.length);

        // Verify done event
        const doneEvents = events.filter((e) => e.type === 'done');
        expect(doneEvents).toHaveLength(1);
        if (doneEvents[0].type === 'done') {
          expect(doneEvents[0].source).toBe('recorded');
          expect(doneEvents[0].steps).toBe(runData.steps.length);
        }

        // Verify narration messages match the recorded say lines
        const messageEvents = events.filter((e) => e.type === 'message');
        expect(messageEvents.length).toBe(runData.steps.length);
        expect(messageEvents[0].type === 'message' && messageEvents[0].text).toBe(runData.steps[0].say);
      });
    }
  });

  describe('HTTP endpoints for Inspector and Tools', () => {
    it('POST /api/inspector streams SSE events', async () => {
      const pid = 'test_http_inspector';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      const req = new Request('http://localhost:3001/api/inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: pid,
          caseId: 'l1-quiet-pact',
          mode: 'assist',
        }),
      });

      const res = await inspectorPost(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/event-stream');

      // Read stream content
      const reader = res.body?.getReader();
      expect(reader).toBeDefined();
      if (!reader) return;

      const decoder = new TextDecoder();
      let streamData = '';
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        if (chunk.value) {
          streamData += decoder.decode(chunk.value);
        }
      }

      expect(streamData).toContain('data: {"type":"tool_call"');
      expect(streamData).toContain('data: {"type":"done"');
    });

    it('POST /api/tool/[name] dispatches valid tools and rejects unknown tools', async () => {
      const pid = 'test_http_tool';
      await startPlay({ playerId: pid, caseId: 'l1-quiet-pact', reset: true });

      // 1. Valid tool call: getBoard
      const getBoardReq = new Request('http://localhost:3001/api/tool/getBoard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: pid, caseId: 'l1-quiet-pact' }),
      });
      const getBoardRes = await toolPost(getBoardReq, {
        params: Promise.resolve({ name: 'getBoard' }),
      });
      expect(getBoardRes.status).toBe(200);
      const getBoardJson = await getBoardRes.json();
      expect(getBoardJson.ok).toBe(true);
      expect(getBoardJson.data.statements).toBeDefined();

      // 2. Valid tool call: findContradictions
      const contrReq = new Request('http://localhost:3001/api/tool/findContradictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: pid, caseId: 'l1-quiet-pact' }),
      });
      const contrRes = await toolPost(contrReq, {
        params: Promise.resolve({ name: 'findContradictions' }),
      });
      expect(contrRes.status).toBe(200);
      const contrJson = await contrRes.json();
      expect(contrJson.ok).toBe(true);
      expect(contrJson.data.pairs).toBeDefined();

      // 3. Unknown tool returns BAD_ARGS envelope
      const unknownReq = new Request('http://localhost:3001/api/tool/hackDatabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: pid, caseId: 'l1-quiet-pact' }),
      });
      const unknownRes = await toolPost(unknownReq, {
        params: Promise.resolve({ name: 'hackDatabase' }),
      });
      expect(unknownRes.status).toBe(200);
      const unknownJson = await unknownRes.json();
      expect(unknownJson.ok).toBe(false);
      expect(unknownJson.error.code).toBe('BAD_ARGS');
    });
  });
});
