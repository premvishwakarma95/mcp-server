import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

export function registerAccountTools(server: McpServer) {
  server.tool(
    "linkedin_list_accounts",
    "List all connected LinkedIn accounts in your Unipile workspace. Each account has an account_id you'll pass to other tools to act on behalf of that account.",
    {
      limit: z.number().int().min(1).max(250).optional().default(50),
      cursor: z.string().optional(),
    },
    async (args) => {
      const data = await getUnipileClient().get("/api/v1/accounts", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_account",
    "Get details for one connected LinkedIn account by its Unipile account_id (status, owner, sync state).",
    {
      account_id: z.string().describe("Unipile account_id"),
    },
    async (args) => {
      const data = await getUnipileClient().get(`/api/v1/accounts/${args.account_id}`);
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_resync_account",
    "Trigger a fresh sync of a connected LinkedIn account (useful if data seems stale).",
    {
      account_id: z.string().describe("Unipile account_id"),
    },
    async (args) => {
      const data = await getUnipileClient().post(
        `/api/v1/accounts/${args.account_id}/resync`
      );
      return jsonResult(data);
    }
  );
}
