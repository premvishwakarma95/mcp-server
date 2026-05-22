import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPeopleTools } from "./people.js";
import { registerCompanyTools } from "./companies.js";
import { registerAccountTools } from "./accounts.js";
import { registerListsTools } from "./lists.js";
import { registerSequencesTools } from "./sequences.js";
import { registerContactTools } from "./contacts.js";
import { registerOpportunityTools } from "./opportunities.js";
import { registerTaskTools } from "./tasks.js";
import { registerUserTools } from "./users.js";

export function registerAllTools(server: McpServer) {
  registerPeopleTools(server);
  registerCompanyTools(server);
  registerAccountTools(server);
  registerListsTools(server);
  registerSequencesTools(server);
  registerContactTools(server);
  registerOpportunityTools(server);
  registerTaskTools(server);
  registerUserTools(server);
}
