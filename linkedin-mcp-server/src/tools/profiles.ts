import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

const SECTIONS = [
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "volunteering",
  "projects",
  "publications",
  "honors",
  "patents",
  "courses",
  "test_scores",
  "organizations",
  "recommendations",
] as const;

export function registerProfileTools(server: McpServer) {
  server.tool(
    "linkedin_get_profile",
    "Get a LinkedIn person's profile by their public identifier (e.g. 'satyanadella') or full LinkedIn URL. Pass linkedin_sections to fetch detailed sections like experience, education, skills.",
    {
      account_id: z.string().describe("Unipile account_id to use for the request"),
      identifier: z
        .string()
        .describe("LinkedIn public identifier (handle), member ID, or full profile URL"),
      linkedin_sections: z
        .array(z.enum(SECTIONS))
        .optional()
        .describe("Profile sections to expand. Omit for basic profile only."),
    },
    async (args) => {
      const { account_id, identifier, linkedin_sections } = args;
      const params: Record<string, any> = { account_id };
      if (linkedin_sections?.length) {
        params.linkedin_sections = linkedin_sections.join(",");
      }
      const data = await getUnipileClient().get(
        `/api/v1/users/${encodeURIComponent(identifier)}`,
        params
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_company",
    "Get a LinkedIn company's full profile by handle (e.g. 'microsoft') or company page URL.",
    {
      account_id: z.string(),
      identifier: z.string().describe("Company public identifier or LinkedIn company URL"),
    },
    async (args) => {
      const data = await getUnipileClient().get(
        `/api/v1/users/company/${encodeURIComponent(args.identifier)}`,
        { account_id: args.account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_my_profile",
    "Get the authenticated user's own LinkedIn profile (the account that's connected via account_id).",
    {
      account_id: z.string(),
    },
    async (args) => {
      const data = await getUnipileClient().get(`/api/v1/users/me`, {
        account_id: args.account_id,
      });
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_relations",
    "List the LinkedIn connections of the authenticated account.",
    {
      account_id: z.string(),
      limit: z.number().int().min(1).max(200).optional().default(50),
      cursor: z.string().optional(),
    },
    async (args) => {
      const data = await getUnipileClient().get("/api/v1/users/relations", args);
      return jsonResult(data);
    }
  );
}
