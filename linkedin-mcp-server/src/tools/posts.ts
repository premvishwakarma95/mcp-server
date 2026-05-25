import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUnipileClient } from "../unipile/client.js";
import { jsonResult } from "../util/response.js";

export function registerPostTools(server: McpServer) {
  server.tool(
    "linkedin_list_posts",
    "List posts from a person or company on LinkedIn.",
    {
      account_id: z.string(),
      identifier: z
        .string()
        .describe("LinkedIn person handle, company handle, or profile URL"),
      limit: z.number().int().min(1).max(100).optional().default(20),
      cursor: z.string().optional(),
    },
    async (args) => {
      const { account_id, identifier, ...rest } = args;
      const data = await getUnipileClient().get(
        `/api/v1/users/${encodeURIComponent(identifier)}/posts`,
        { account_id, ...rest }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_get_post",
    "Get the full details of a single LinkedIn post (content, engagement, comments).",
    {
      account_id: z.string(),
      post_id: z.string().describe("LinkedIn post ID or URN"),
    },
    async (args) => {
      const data = await getUnipileClient().get(
        `/api/v1/posts/${encodeURIComponent(args.post_id)}`,
        { account_id: args.account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_create_post",
    "Publish a new LinkedIn post from the authenticated account.",
    {
      account_id: z.string(),
      text: z.string().describe("Post body text"),
      visibility: z
        .enum(["public", "connections"])
        .optional()
        .default("public"),
    },
    async (args) => {
      const { account_id, ...body } = args;
      const data = await getUnipileClient().post(`/api/v1/posts`, body, {
        account_id,
      });
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_comment_on_post",
    "Add a comment on a LinkedIn post.",
    {
      account_id: z.string(),
      post_id: z.string(),
      text: z.string().describe("Comment text"),
    },
    async (args) => {
      const { account_id, post_id, text } = args;
      const data = await getUnipileClient().post(
        `/api/v1/posts/${encodeURIComponent(post_id)}/comments`,
        { text },
        { account_id }
      );
      return jsonResult(data);
    }
  );

  server.tool(
    "linkedin_react_to_post",
    "Add a reaction (like, celebrate, support, etc.) to a LinkedIn post.",
    {
      account_id: z.string(),
      post_id: z.string(),
      reaction: z
        .enum(["like", "celebrate", "support", "love", "insightful", "funny"])
        .default("like"),
    },
    async (args) => {
      const { account_id, post_id, reaction } = args;
      const data = await getUnipileClient().post(
        `/api/v1/posts/${encodeURIComponent(post_id)}/reactions`,
        { reaction },
        { account_id }
      );
      return jsonResult(data);
    }
  );
}
