import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/index.js";

// creating MCP server and registering all tools
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "apollo-mcp-server",
    version: "0.1.0",
  });
  registerAllTools(server);
  return server;
}
