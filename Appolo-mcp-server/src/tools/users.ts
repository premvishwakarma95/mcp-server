import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerUserTools(server: McpServer) {
  server.tool(
    "apollo_get_users",
    "List all users (team members) in your Apollo workspace. Useful for getting user IDs to assign tasks or deals.",
    {
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(50),
    },
    async (args) => {
      const data = await getApolloClient().get("/api/v1/users/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_news_articles",
    "Get news articles about a company or industry. Useful as a trigger event signal for outreach.",
    {
      organization_ids: z
        .array(z.string())
        .optional()
        .describe("Filter news to specific Apollo organization IDs"),
      categories: z
        .array(z.string())
        .optional()
        .describe('News categories, e.g. ["hires", "leadership", "funding", "product"]'),
      published_at_date_range_mode: z
        .enum(["due_in", "due_within", "due_at_or_after", "due_at_or_before"])
        .optional(),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/news_articles/search", args);
      return jsonResult(data);
    }
  );
}
