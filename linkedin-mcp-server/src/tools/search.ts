import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "linkedin_search",
    "Search LinkedIn for profiles, companies, posts, or jobs. Mirrors Sales Navigator search filters when available. Pass an `api` of 'classic' (LinkedIn regular search) or 'sales_navigator' (if account has Sales Nav) or 'recruiter' (if account has Recruiter).",
    {
      account_id: z.string().describe("Unipile account_id to use"),
      api: z
        .enum(["classic", "sales_navigator", "recruiter"])
        .optional()
        .default("classic")
        .describe("Which LinkedIn search API to use — depends on the account's subscription"),
      category: z
        .enum(["people", "companies", "posts", "jobs"])
        .describe("Type of entity to search"),
      keywords: z.string().optional().describe("Free-text search query"),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      title: z.string().optional().describe("Filter by job title (people search)"),
      company: z.string().optional().describe("Filter by company name"),
      location: z.string().optional().describe("Geographic filter, e.g. 'Australia', 'Sydney'"),
      industry: z.string().optional().describe("Industry filter, e.g. 'Software Development'"),
      school: z.string().optional(),
      sort_by: z.enum(["relevance", "recent"]).optional(),
      limit: z.number().int().min(1).max(50).optional().default(10),
      cursor: z.string().optional().describe("Pagination cursor from a prior call"),
    },
    async (args) => {
      const { account_id, ...filters } = args;
      const data = await getUnipileClient().post(
        `/api/v1/linkedin/search`,
        filters,
        { account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_search_via_url",
    "Run a LinkedIn search by passing an existing LinkedIn or Sales Navigator search URL. Useful when you've crafted a complex search in the UI and want to fetch its results.",
    {
      account_id: z.string(),
      url: z.string().describe("Full LinkedIn search URL (regular or Sales Navigator)"),
      limit: z.number().int().min(1).max(50).optional().default(10),
      cursor: z.string().optional(),
    },
    async (args) => {
      const { account_id, ...body } = args;
      const data = await getUnipileClient().post(
        `/api/v1/linkedin/search/url`,
        body,
        { account_id }
      );
      return jsonResult(data);
    }
  );
}
