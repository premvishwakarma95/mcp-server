import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApolloClient } from "../apollo/client.js";
import { jsonResult } from "../util/response.js";

export function registerTaskTools(server: McpServer) {
  server.tool(
    "apollo_search_tasks",
    "Search tasks assigned to users in your Apollo workspace.",
    {
      user_ids: z.array(z.string()).optional().describe("Filter by assignee user IDs"),
      open_factor_names: z
        .array(z.enum(["task_priority", "task_due_at"]))
        .optional()
        .describe("How to sort/filter open tasks"),
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(25),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/tasks/search", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "apollo_create_tasks",
    "Create one or more follow-up tasks (call, email, LinkedIn touch, action item) for contacts.",
    {
      user_id: z.string().describe("User ID the tasks will be assigned to"),
      contact_ids: z.array(z.string()).min(1).describe("Contact IDs to create tasks for"),
      priority: z
        .enum(["high", "medium", "low"])
        .optional()
        .default("medium")
        .describe("Task priority"),
      due_at: z.string().optional().describe("Due date/time in ISO format"),
      type: z
        .enum(["call", "outreach_manual_email", "linkedin_step_connect", "linkedin_step_message", "linkedin_step_view_profile", "linkedin_step_interact_post", "action_item"])
        .describe("Type of task"),
      status: z
        .enum(["scheduled", "completed", "skipped"])
        .optional()
        .default("scheduled"),
      note: z.string().optional().describe("Optional note/description"),
    },
    async (args) => {
      const data = await getApolloClient().post("/api/v1/tasks/bulk_create", args);
      return jsonResult(data);
    }
  );
}
