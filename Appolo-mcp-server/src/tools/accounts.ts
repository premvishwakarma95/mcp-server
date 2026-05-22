import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerAccountTools(server: McpServer) {
  server.tool(
    "apollo_search_accounts",
    "Search your CRM accounts (companies you have already saved/imported to your workspace, as opposed to the global company database). Use apollo_search_companies for the global DB.",
    {
      q_keywords: z.string().optional().describe("Free-text search across saved accounts"),
      account_stage_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by account stage IDs"),
      sort_by_field: z
        .string()
        .optional()
        .describe('Sort field, e.g. "account_last_activity_date"'),
      sort_ascending: z.boolean().optional(),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/accounts/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_create_account",
    "Create a new account (saved company) in your Apollo CRM.",
    {
      name: z.string().describe("Company name"),
      domain: z.string().optional().describe("Primary domain (e.g. apollo.io)"),
      phone: z.string().optional(),
      raw_address: z.string().optional().describe("Free-form address"),
      account_stage_id: z.string().optional(),
      owner_id: z.string().optional().describe("User ID of the account owner"),
      label_names: z.array(z.string()).optional().describe("Lists to attach"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/accounts", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_update_account",
    "Update an existing account in your CRM.",
    {
      account_id: z.string().describe("Apollo account ID"),
      name: z.string().optional(),
      domain: z.string().optional(),
      phone: z.string().optional(),
      raw_address: z.string().optional(),
      account_stage_id: z.string().optional(),
      owner_id: z.string().optional(),
      label_names: z.array(z.string()).optional(),
    },
    async (args) => {
      const { account_id, ...body } = args;
      const data = await getApolloClient().put(`/api/v1/accounts/${account_id}`, body);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_bulk_create_accounts",
    "Create multiple accounts in a single request. Accepts up to 25 accounts.",
    {
      accounts: z
        .array(
          z.object({
            name: z.string(),
            domain: z.string().optional(),
            phone: z.string().optional(),
            account_stage_id: z.string().optional(),
            owner_id: z.string().optional(),
          })
        )
        .min(1)
        .max(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/accounts/bulk_create", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_account_stages",
    "Get all account stages (e.g. Prospect, Engaged, Customer, Churned) in your workspace.",
    {},
    async () => {
      const data = await getApolloClient().get("/api/v1/account_stages");
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_update_account_stage",
    "Move one or more accounts to a different stage.",
    {
      account_ids: z.array(z.string()).min(1),
      account_stage_id: z.string().describe("Target stage ID"),
    },
    async (args) => {
      const data = await getApolloClient().post(
        "/api/v1/accounts/update_stages",
        args
      );
      return jsonResult(data);
    }
  );
}
