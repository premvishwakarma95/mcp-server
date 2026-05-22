import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerPeopleTools(server: McpServer) {
  server.tool(
    "apollo_search_people",
    "Search Apollo's database of 230M+ people. Filter by job title, location, company, industry, seniority, and more. Returns a paginated list of matching people with basic info (use apollo_enrich_person to reveal email/phone).",
    {
      person_titles: z
        .array(z.string())
        .optional()
        .describe('Job titles to match, e.g. ["Marketing Director", "VP of Sales"]'),
      person_seniorities: z
        .array(z.enum(["owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry", "intern"]))
        .optional()
        .describe("Seniority levels to filter by"),
      person_locations: z
        .array(z.string())
        .optional()
        .describe('Person locations, e.g. ["Australia", "Sydney, Australia"]'),
      organization_locations: z
        .array(z.string())
        .optional()
        .describe("Filter by where the person's company is headquartered"),
      q_organization_domains: z
        .array(z.string())
        .optional()
        .describe('Filter by company domain(s), e.g. ["microsoft.com", "google.com"]'),
      organization_num_employees_ranges: z
        .array(z.string())
        .optional()
        .describe('Company size ranges, e.g. ["1,10", "11,50", "51,200", "201,500", "501,1000", "1001,5000", "5001,10000", "10001,1000000"]'),
      q_keywords: z
        .string()
        .optional()
        .describe("Free-text keyword search across the person's profile"),
      page: z.number().int().min(1).optional().default(1).describe("Page number (1-indexed)"),
      per_page: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(25)
        .describe("Results per page, max 100"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/mixed_people/api_search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_top_people_at_company",
    "Get the top people (decision-makers, leadership) at a specific company. Use this when you already know the company and want its key contacts.",
    {
      organization_id: z
        .string()
        .describe("Apollo organization ID (get from apollo_search_companies results)"),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post(
        "/api/v1/mixed_people/organization_top_people",
        args
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_enrich_person",
    "Enrich a single person and reveal their verified email and phone number. Costs 1 credit per call (8 for phone). PREFERRED FLOW: first call apollo_search_people to get the person's Apollo `id`, then call this tool with that id — that's the most reliable match. Apollo masks last names in search responses on Basic plan, so matching by name alone often fails.",
    {
      id: z.string().optional().describe("Apollo person ID (from search results) — most reliable match"),
      first_name: z.string().optional().describe("First name"),
      last_name: z.string().optional().describe("Last name"),
      name: z.string().optional().describe("Full name (alternative to first_name + last_name)"),
      email: z.string().optional().describe("Known email address"),
      organization_name: z.string().optional().describe("Company name where the person works"),
      domain: z.string().optional().describe("Company domain, e.g. apollo.io"),
      linkedin_url: z.string().optional().describe("LinkedIn profile URL"),
      reveal_personal_emails: z
        .boolean()
        .optional()
        .describe("Reveal personal email addresses (extra credits)"),
      reveal_phone_number: z
        .boolean()
        .optional()
        .describe("Reveal mobile phone number (8x credits)"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/people/match", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_bulk_enrich_people",
    "Enrich up to 10 people in a single request. Each match consumes credits. Pass an array of person identifiers.",
    {
      details: z
        .array(
          z.object({
            id: z.string().optional(),
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            name: z.string().optional(),
            email: z.string().optional(),
            organization_name: z.string().optional(),
            domain: z.string().optional(),
            linkedin_url: z.string().optional(),
          })
        )
        .min(1)
        .max(10)
        .describe("Array of person identifiers to enrich (max 10). Prefer passing Apollo person `id` from search results."),
      reveal_personal_emails: z.boolean().optional(),
      reveal_phone_number: z.boolean().optional(),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/people/bulk_match", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_person",
    "Get full details for a single person by Apollo person ID. Returns deeper profile data than search results (employment history, education, social profiles, etc.).",
    {
      id: z.string().describe("Apollo person ID"),
    },
    async (args) => {
      const data = await getApolloClient().get(`/api/v1/people/${args.id}`);
      return jsonResult(data);
    }
  );
}
