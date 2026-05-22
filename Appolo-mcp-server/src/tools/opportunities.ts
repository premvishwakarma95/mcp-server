import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerOpportunityTools(server: McpServer) {
  server.tool(
    "apollo_search_opportunities",
    "Search deals/opportunities in your Apollo CRM.",
    {
      q_keywords: z.string().optional(),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/opportunities/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_create_opportunity",
    "Create a new deal/opportunity in your Apollo CRM.",
    {
      name: z.string().describe("Name of the opportunity"),
      owner_id: z.string().optional().describe("User ID of the deal owner"),
      account_id: z.string().optional().describe("Apollo account/company ID this deal is tied to"),
      amount: z.number().optional().describe("Deal amount (USD)"),
      opportunity_stage_id: z.string().optional().describe("Stage of the deal"),
      closed_date: z.string().optional().describe("Expected close date (YYYY-MM-DD)"),
      description: z.string().optional(),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/opportunities", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_update_opportunity",
    "Update an existing deal/opportunity.",
    {
      opportunity_id: z.string().describe("ID of the opportunity to update"),
      name: z.string().optional(),
      amount: z.number().optional(),
      opportunity_stage_id: z.string().optional(),
      closed_date: z.string().optional(),
      description: z.string().optional(),
    },
    async (args) => {
      const { opportunity_id, ...body } = args;
      const data = await getApolloClient().patch(
        `/api/v1/opportunities/${opportunity_id}`,
        body
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_opportunity_stages",
    "Get all deal stages (e.g. Prospecting, Qualified, Negotiation, Closed Won) in your Apollo workspace.",
    {},
    async () => {
      const data = await getApolloClient().get("/api/v1/opportunity_stages");
      return jsonResult(data);
    }
  );
}
