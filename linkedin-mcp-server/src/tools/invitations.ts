import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

export function registerInvitationTools(server: McpServer) {
  server.tool(
    "linkedin_send_invitation",
    "Send a LinkedIn connection request. Optionally include a personalized note (max 300 chars). NOTE: LinkedIn limits invitations strictly — sending too many per day risks account restriction.",
    {
      account_id: z.string().describe("Unipile account_id sending the invitation"),
      provider_id: z
        .string()
        .describe(
          "LinkedIn provider_id of the recipient (from search results or profile lookup)"
        ),
      message: z
        .string()
        .max(300)
        .optional()
        .describe("Personalized note (max 300 characters)"),
    },
    async (args) => {
      const { account_id, ...body } = args;
      const data = await getUnipileClient().post(
        `/api/v1/users/invite`,
        body,
        { account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_list_invitations_sent",
    "List invitations the authenticated user has sent. Useful for tracking pending requests.",
    {
      account_id: z.string(),
      limit: z.number().int().min(1).max(100).optional().default(50),
      cursor: z.string().optional(),
    },
    async (args) => {
      const data = await getUnipileClient().get("/api/v1/users/invite/sent", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_list_invitations_received",
    "List invitations received by the authenticated user (pending connection requests to them).",
    {
      account_id: z.string(),
      limit: z.number().int().min(1).max(100).optional().default(50),
      cursor: z.string().optional(),
    },
    async (args) => {
      const data = await getUnipileClient().get("/api/v1/users/invite/received", args);
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_cancel_invitation",
    "Withdraw / cancel a sent connection invitation.",
    {
      account_id: z.string(),
      invitation_id: z.string().describe("Unipile invitation ID"),
    },
    async (args) => {
      const data = await getUnipileClient().delete(
        `/api/v1/users/invite/${args.invitation_id}`,
        { account_id: args.account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_accept_invitation",
    "Accept an incoming LinkedIn connection request.",
    {
      account_id: z.string(),
      invitation_id: z.string(),
    },
    async (args) => {
      const data = await getUnipileClient().post(
        `/api/v1/users/invite/${args.invitation_id}/accept`,
        {},
        { account_id: args.account_id }
      );
      return jsonResult(data);
    }
  );
}
