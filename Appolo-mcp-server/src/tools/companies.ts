import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerCompanyTools(server: McpServer) {
  server.tool(
    "apollo_search_companies",
    "Search Apollo's database of 30M+ companies. Filter by industry, location, employee count, revenue, technology used, and more. Returns the matching companies with firmographic data.",
    {
      organization_locations: z
        .array(z.string())
        .optional()
        .describe('Headquarters locations, e.g. ["Australia", "United States"]'),
      organization_num_employees_ranges: z
        .array(z.string())
        .optional()
        .describe('Employee count ranges, e.g. ["1,10", "11,50", "51,200"]'),
      q_organization_keyword_tags: z
        .array(z.string())
        .optional()
        .describe('Industry / keyword tags, e.g. ["saas", "fintech", "education"]'),
      q_organization_name: z
        .string()
        .optional()
        .describe("Filter by company name (partial match)"),
      organization_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by specific Apollo organization IDs"),
      revenue_range_min: z.number().optional().describe("Minimum annual revenue (USD)"),
      revenue_range_max: z.number().optional().describe("Maximum annual revenue (USD)"),
      currently_using_any_of_technology_uids: z
        .array(z.string())
        .optional()
        .describe('Technologies the company uses, e.g. ["salesforce", "stripe"]'),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/mixed_companies/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_company",
    "Get full details for a single company by Apollo organization ID. Returns deeper firmographic data than search results.",
    {
      id: z.string().describe("Apollo organization ID"),
    },
    async (args) => {
      const data = await getApolloClient().get(`/api/v1/organizations/${args.id}`);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_enrich_company",
    "Enrich a single company by domain. Returns firmographics: industry, size, revenue, location, tech stack, social profiles, etc.",
    {
      domain: z.string().describe("Company domain, e.g. apollo.io (without https://)"),
    },
    async (args) => {
      const data = await getApolloClient().get("/api/v1/organizations/enrich", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_bulk_enrich_companies",
    "Enrich up to 10 companies by domain in a single request.",
    {
      domains: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe("Array of company domains to enrich (max 10)"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/organizations/bulk_enrich", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_company_job_postings",
    "Get current job postings for a company by Apollo organization ID. Useful as a signal of hiring/growth.",
    {
      organization_id: z.string().describe("Apollo organization ID"),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const { organization_id, ...rest } = args;
      const data = await getApolloClient().get(
        `/api/v1/organizations/${organization_id}/job_postings`,
        rest
      );
      return jsonResult(data);
    }
  );
}
