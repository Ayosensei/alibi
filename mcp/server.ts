// mcp/server.ts — MCP server stub for Track 01 tools
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export const server = new McpServer({
  name: 'alibi-inspector',
  version: '0.1.0',
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startMcpServer().catch((err) => {
    console.error('Failed to start MCP server:', err);
    process.exit(1);
  });
}
