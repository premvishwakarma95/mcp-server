import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerContactTools(server: McpServer) {
  server.tool(
    "apollo_search_contacts",
    "Search your CRM contacts in Apollo (people you have already saved/imported to your workspace, as opposed to the global database).",
    {
      q_keywords: z.string().optional().describe("Free-text search"),
      contact_label_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by list (label) IDs"),
      contact_stage_ids: z
        .array(z.string())
        .optional()
        .describe("Filter by contact stage IDs"),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/contacts/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_create_contact",
    "Create a new contact in your Apollo CRM.",
    {
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      organization_name: z.string().optional(),
      title: z.string().optional(),
      email: z.string().optional(),
      website_url: z.string().optional(),
      direct_phone: z.string().optional(),
      corporate_phone: z.string().optional(),
      mobile_phone: z.string().optional(),
      label_names: z.array(z.string()).optional().describe("List names to apply"),
      contact_stage_id: z.string().optional(),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/contacts", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_update_contact",
    "Update an existing contact in your Apollo CRM.",
    {
      contact_id: z.string().describe("Apollo contact ID to update"),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      organization_name: z.string().optional(),
      title: z.string().optional(),
      email: z.string().optional(),
      contact_stage_id: z.string().optional(),
      label_names: z.array(z.string()).optional(),
    },
    async (args) => {
      const { contact_id, ...body } = args;
      const data = await getApolloClient().put(`/api/v1/contacts/${contact_id}`, body);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_get_contact_stages",
    "Get all contact stages (e.g. Cold, Warm, Engaged, Customer) in your Apollo workspace.",
    {},
    async () => {
      const data = await getApolloClient().get("/api/v1/contact_stages");
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_update_contact_stage",
    "Move one or more contacts to a different stage (e.g. mark as 'Engaged').",
    {
      contact_ids: z.array(z.string()).min(1),
      contact_stage_id: z.string().describe("Target stage ID"),
    },
    async (args) => {
      const data = await getApolloClient().post(
        "/api/v1/contacts/update_stages",
        args
      );
      return jsonResult(data);
    }
  );
}
