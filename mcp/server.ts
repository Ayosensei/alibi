// mcp/server.ts — MCP server for Track 01 reasoning tools
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TOOL_DISPATCH } from '@/engine/inspector';
import { ensureCases } from '@/engine/seed';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'alibi-inspector',
    version: '0.1.0',
  });

  const getEnvCtx = (args: { playerId?: string; caseId?: string }) => ({
    playerId: args.playerId || process.env.ALIBI_MCP_PLAYER || 'demo',
    caseId: args.caseId || process.env.ALIBI_MCP_CASE || 'l1-quiet-pact',
  });

  // 1. getBoard
  server.tool(
    'getBoard',
    'Return everything the player has discovered in a case.',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.getBoard(ctx);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 2. findContradictions
  server.tool(
    'findContradictions',
    'List pairs of statements or evidence that cannot both be true.',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.findContradictions(ctx);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 3. findRehearsedAlibis
  server.tool(
    'findRehearsedAlibis',
    'Find statements from different people that share identical details.',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.findRehearsedAlibis(ctx);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 4. findImpossibleMoves
  server.tool(
    'findImpossibleMoves',
    'Find people whose placements require travelling faster than the map allows.',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.findImpossibleMoves(ctx);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 5. checkFeasibility
  server.tool(
    'checkFeasibility',
    'Could this person have been in this room at this time, given hard evidence and the map?',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
      person: z.string(),
      slot: z.number().int().min(1).max(8),
      room: z.string(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.checkFeasibility({
        ...ctx,
        person: args.person,
        slot: args.slot,
        room: args.room,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 6. whoCouldHave
  server.tool(
    'whoCouldHave',
    'Of the people allowed to do an act, who could physically have done it?',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
      evidenceId: z.string(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.whoCouldHave({
        ...ctx,
        evidenceId: args.evidenceId,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 7. motivePaths
  server.tool(
    'motivePaths',
    'Show known relationship paths from a person to the victim.',
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
      person: z.string(),
      maxHops: z.number().int().min(1).max(3).optional(),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.motivePaths({
        ...ctx,
        person: args.person,
        maxHops: args.maxHops,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // 8. alibiSupport
  server.tool(
    'alibiSupport',
    "Who vouches for this person's claimed location, and are they reliable?",
    {
      playerId: z.string().optional(),
      caseId: z.string().optional(),
      person: z.string(),
      slot: z.number().int().min(1).max(8),
    },
    async (args) => {
      const ctx = getEnvCtx(args);
      const res = await TOOL_DISPATCH.alibiSupport({
        ...ctx,
        person: args.person,
        slot: args.slot,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
        isError: !res.ok,
      };
    }
  );

  // Optional board writes if ALIBI_MCP_WRITE=1
  if (process.env.ALIBI_MCP_WRITE === '1') {
    server.tool(
      'flag',
      'Record an inspector flag on the evidence board.',
      {
        playerId: z.string().optional(),
        caseId: z.string().optional(),
        kind: z.enum(['contradiction', 'rehearsed', 'impossible', 'cleared', 'slip', 'custom']),
        refs: z.array(z.string()),
        note: z.string().max(280),
      },
      async (args) => {
        const ctx = getEnvCtx(args);
        const res = await TOOL_DISPATCH.flag({
          ...ctx,
          kind: args.kind,
          refs: args.refs,
          note: args.note,
          by: 'inspector',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok,
        };
      }
    );

    server.tool(
      'hypothesize',
      'Record an inspector hypothesis on the evidence board.',
      {
        playerId: z.string().optional(),
        caseId: z.string().optional(),
        text: z.string().max(300),
        person: z.string().optional(),
        confidence: z.number().min(0).max(1),
        supportedBy: z.array(z.string()),
      },
      async (args) => {
        const ctx = getEnvCtx(args);
        const res = await TOOL_DISPATCH.hypothesize({
          ...ctx,
          text: args.text,
          person: args.person,
          confidence: args.confidence,
          supportedBy: args.supportedBy,
          by: 'inspector',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(res, null, 2) }],
          isError: !res.ok,
        };
      }
    );
  }

  return server;
}

export const server = createMcpServer();

export async function startMcpServer() {
  await ensureCases();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startMcpServer().catch((err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
  });
}
