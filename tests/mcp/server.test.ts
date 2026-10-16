import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../../mcp/server';
import { ensureCases } from '@/engine/seed';
import { loadColdBoard } from '@/engine/inspector';

describe('MCP Server (Task M1)', () => {
  beforeAll(async () => {
    await ensureCases();
  });

  async function createConnectedClient(server = createMcpServer()) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client(
      { name: 'test-inspector-client', version: '1.0.0' },
      { capabilities: {} }
    );
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
    return { client, server };
  }

  function parseResultBody(result: unknown): any {
    const res = result as { content?: Array<{ type: string; text?: string }> };
    if (!res.content || !res.content[0]?.text) {
      throw new Error('Result has no text content');
    }
    return JSON.parse(res.content[0].text);
  }

  it('lists the 8 reasoning read tools by default', async () => {
    const origEnv = process.env.ALIBI_MCP_WRITE;
    delete process.env.ALIBI_MCP_WRITE;

    const { client, server } = await createConnectedClient();
    try {
      const toolList = await client.listTools();
      const toolNames = toolList.tools.map((t) => t.name).sort();

      expect(toolNames).toEqual([
        'alibiSupport',
        'checkFeasibility',
        'findContradictions',
        'findImpossibleMoves',
        'findRehearsedAlibis',
        'getBoard',
        'motivePaths',
        'whoCouldHave',
      ]);

      for (const tool of toolList.tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
      }
    } finally {
      await client.close();
      await server.close();
      if (origEnv !== undefined) process.env.ALIBI_MCP_WRITE = origEnv;
    }
  });

  it('conditionally includes flag and hypothesize when ALIBI_MCP_WRITE=1', async () => {
    const origEnv = process.env.ALIBI_MCP_WRITE;
    process.env.ALIBI_MCP_WRITE = '1';

    const { client, server } = await createConnectedClient();
    try {
      const toolList = await client.listTools();
      const toolNames = toolList.tools.map((t) => t.name).sort();

      expect(toolNames).toEqual([
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
    } finally {
      await client.close();
      await server.close();
      if (origEnv !== undefined) {
        process.env.ALIBI_MCP_WRITE = origEnv;
      } else {
        delete process.env.ALIBI_MCP_WRITE;
      }
    }
  });

  it('calls findContradictions and returns oracle-matching contradictions on a cold board', async () => {
    const playerId = 'test_mcp_l1';
    const caseId = 'l1-quiet-pact';

    const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
    const runData = JSON.parse(readFileSync(runPath, 'utf8'));
    await loadColdBoard(playerId, caseId, runData.board);

    const oraclePath = join(process.cwd(), 'fixtures', `${caseId}.oracle.json`);
    const oracle = JSON.parse(readFileSync(oraclePath, 'utf8'));

    const { client, server } = await createConnectedClient();
    try {
      const result = await client.callTool({
        name: 'findContradictions',
        arguments: { playerId, caseId },
      });

      expect(result.isError).toBeFalsy();
      const body = parseResultBody(result);
      expect(body.ok).toBe(true);
      expect(body.data.pairs).toBeDefined();

      // Normalize pairs to sorted tuples of claim/evidence IDs
      const actualPairs = body.data.pairs.map((p: any) =>
        [p.a.src, p.b.src].sort()
      );

      // Verify that every oracle contradiction is detected
      for (const expectedPair of oracle.contradictions) {
        const sortedExpected = [...expectedPair].sort();
        const found = actualPairs.some(
          (act: string[]) =>
            act[0] === sortedExpected[0] && act[1] === sortedExpected[1]
        );
        expect(found).toBe(true);
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('calls findRehearsedAlibis and returns oracle-matching groups', async () => {
    const playerId = 'test_mcp_rehearsed';
    const caseId = 'l1-quiet-pact';

    const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
    const runData = JSON.parse(readFileSync(runPath, 'utf8'));
    await loadColdBoard(playerId, caseId, runData.board);

    const oraclePath = join(process.cwd(), 'fixtures', `${caseId}.oracle.json`);
    const oracle = JSON.parse(readFileSync(oraclePath, 'utf8'));

    const { client, server } = await createConnectedClient();
    try {
      const result = await client.callTool({
        name: 'findRehearsedAlibis',
        arguments: { playerId, caseId },
      });

      expect(result.isError).toBeFalsy();
      const body = parseResultBody(result);
      expect(body.ok).toBe(true);

      const actualGroups = body.data.groups.map((g: any) =>
        [...g.claimIds].sort()
      );
      const expectedGroups = oracle.rehearsed.map((grp: string[]) =>
        [...grp].sort()
      );

      for (const exp of expectedGroups) {
        const found = actualGroups.some(
          (act: string[]) => JSON.stringify(act) === JSON.stringify(exp)
        );
        expect(found).toBe(true);
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('calls getBoard and returns board snapshot', async () => {
    const playerId = 'test_mcp_board';
    const caseId = 'l1-quiet-pact';

    const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
    const runData = JSON.parse(readFileSync(runPath, 'utf8'));
    await loadColdBoard(playerId, caseId, runData.board);

    const { client, server } = await createConnectedClient();
    try {
      const result = await client.callTool({
        name: 'getBoard',
        arguments: { playerId, caseId },
      });

      expect(result.isError).toBeFalsy();
      const body = parseResultBody(result);
      expect(body.ok).toBe(true);
      expect(body.data.evidence.length).toBeGreaterThan(0);
      expect(body.data.statements.length).toBeGreaterThan(0);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('calls whoCouldHave on Level 3 and matches oracle survivors', async () => {
    const playerId = 'test_mcp_l3';
    const caseId = 'l3-blackout-dinner';

    const runPath = join(process.cwd(), 'cases', `${caseId}.run.json`);
    const runData = JSON.parse(readFileSync(runPath, 'utf8'));
    await loadColdBoard(playerId, caseId, runData.board);

    const { client, server } = await createConnectedClient();
    try {
      const result = await client.callTool({
        name: 'whoCouldHave',
        arguments: { playerId, caseId, evidenceId: 'e3_meter' },
      });

      expect(result.isError).toBeFalsy();
      const body = parseResultBody(result);
      expect(body.ok).toBe(true);
      expect(body.data.status).toBe('ok');
      expect(body.data.survivors).toEqual(['clara']);
      expect(body.data.survivors).not.toContain('tobias');
      expect(body.data.survivors).not.toContain('roz');
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('handles invalid arguments or missing game sessions with isError: true', async () => {
    const { client, server } = await createConnectedClient();
    try {
      const result = await client.callTool({
        name: 'findContradictions',
        arguments: { playerId: 'non_existent_player_12345', caseId: 'l1-quiet-pact' },
      });

      expect(result.isError).toBe(true);
      const body = parseResultBody(result);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNKNOWN_PLAY');
    } finally {
      await client.close();
      await server.close();
    }
  });
});
