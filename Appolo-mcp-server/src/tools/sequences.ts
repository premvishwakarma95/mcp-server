import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerSequencesTools(server: McpServer) {
  server.tool(
    "apollo_search_sequences",
    "Search outreach sequences (emailer campaigns) in your Apollo workspace.",
    {
      q_name: z.string().optional().describe("Filter sequences by name (partial match)"),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/emailer_campaigns/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_add_contacts_to_sequence",
    "Add contacts to an outreach sequence. The sequence will start sending automated emails based on its configuration.",
    {
      sequence_id: z.string().describe("ID of the sequence (emailer campaign) to add contacts to"),
      contact_ids: z.array(z.string()).min(1).describe("Apollo contact IDs to add"),
      emailer_campaign_id: z.string().optional().describe("Optional override for the campaign ID"),
      send_email_from_email_account_id: z
        .string()
        .optional()
        .describe("Email account ID to send from"),
    },
    async (args) => {
      const { sequence_id, ...body } = args;
      const data = await getApolloClient().post(
        `/api/v1/emailer_campaigns/${sequence_id}/add_contact_ids`,
        body
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_email_accounts",
    "List all email accounts connected to your Apollo workspace. Use the IDs when adding contacts to sequences.",
    {},
    async () => {
      const data = await getApolloClient().get("/api/v1/email_accounts");
      return jsonResult(data);
    }
  );
}
