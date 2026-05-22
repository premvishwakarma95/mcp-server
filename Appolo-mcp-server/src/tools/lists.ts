import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerListsTools(server: McpServer) {
  server.tool(
    "apollo_get_lists",
    "Get all lists (also called 'labels') in your Apollo workspace. Lists are used to group contacts/accounts.",
    {
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(50),
    },
    async (args) => {
      const data = await getApolloClient().get("/api/v1/labels", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_create_list",
    "Create a new list (label) in Apollo. Returns the list with its ID, which you'll use to add contacts.",
    {
      name: z.string().describe("Name of the new list"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/labels", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_add_contacts_to_list",
    "Add one or more contacts to a list by attaching the list's label name.",
    {
      contact_ids: z
        .array(z.string())
        .min(1)
        .describe("Apollo contact IDs to add to the list"),
      label_names: z
        .array(z.string())
        .min(1)
        .describe("List names to apply to the contacts"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/contacts/add_label", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_remove_contacts_from_list",
    "Remove one or more contacts from a list.",
    {
      contact_ids: z.array(z.string()).min(1),
      label_names: z.array(z.string()).min(1),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/contacts/remove_label", args);
      return jsonResult(data);
    }
  );
}
