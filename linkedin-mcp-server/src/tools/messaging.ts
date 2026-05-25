import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

export function registerMessagingTools(server: McpServer) {
  server.tool(
    "linkedin_list_chats",
    "List LinkedIn conversations (chats) for the authenticated account. Returns chat IDs you can pass to other messaging tools.",
    {
      account_id: z.string(),
      limit: z.number().int().min(1).max(100).optional().default(20),
      cursor: z.string().optional(),
      unread_only: z.boolean().optional().describe("Only return unread chats"),
    },
    async (args) => {
      const { account_id, ...rest } = args;
      const data = await getUnipileClient().get("/api/v1/chats", {
        account_id,
        ...rest,
      });
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_chat",
    "Get the details and message history of a specific LinkedIn chat.",
    {
      account_id: z.string(),
      chat_id: z.string().describe("Unipile chat ID"),
      limit: z.number().int().min(1).max(100).optional().default(50),
      cursor: z.string().optional(),
    },
    async (args) => {
      const { account_id, chat_id, ...rest } = args;
      const data = await getUnipileClient().get(`/api/v1/chats/${chat_id}/messages`, {
        account_id,
        ...rest,
      });
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_start_chat",
    "Start a new LinkedIn chat with one or more attendees. Set inmail=true to send as InMail (uses InMail credits, allowed even when not connected). Otherwise the message goes to an existing connection.",
    {
      account_id: z.string(),
      attendees_ids: z
        .array(z.string())
        .min(1)
        .describe("Array of LinkedIn provider_ids (recipients)"),
      text: z.string().describe("Message body"),
      inmail: z
        .boolean()
        .optional()
        .describe("Send as InMail (requires Sales Nav / Premium + InMail credits)"),
      subject: z.string().optional().describe("Subject line (InMail only)"),
    },
    async (args) => {
      const { account_id, attendees_ids, text, inmail, subject } = args;
      const body: Record<string, any> = { attendees_ids, text };
      if (inmail) {
        body.linkedin = { inmail: true };
        if (subject) body.linkedin.subject = subject;
      }
      const data = await getUnipileClient().post(`/api/v1/chats`, body, {
        account_id,
      });
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_send_message",
    "Send a follow-up message in an existing LinkedIn chat.",
    {
      account_id: z.string(),
      chat_id: z.string().describe("Existing chat ID from linkedin_list_chats"),
      text: z.string().describe("Message body"),
    },
    async (args) => {
      const { account_id, chat_id, text } = args;
      const data = await getUnipileClient().post(
        `/api/v1/chats/${chat_id}/messages`,
        { text },
        { account_id }
      );
      return jsonResult(data);
    }
  );
}
