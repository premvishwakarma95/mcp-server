import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "./accounts.js";
import { registerProfileTools } from "./profiles.js";
import { registerSearchTools } from "./search.js";
import { registerInvitationTools } from "./invitations.js";
import { registerMessagingTools } from "./messaging.js";
import { registerPostTools } from "./posts.js";

export function registerAllTools(server: McpServer) {
  registerAccountTools(server);
  registerProfileTools(server);
  registerSearchTools(server);
  registerInvitationTools(server);
  registerMessagingTools(server);
  registerPostTools(server);
}
