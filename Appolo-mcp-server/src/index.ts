import "dotenv/config";
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server.js";
import { setupOAuth } from "./auth/oauth.js";

const PORT = Number(process.env.PORT) || 3005;

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "4mb" }));

const auth = setupOAuth(app);

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", auth.requireAuth, async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) delete transports[transport.sessionId];
    };
    const server = createMcpServer();
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Bad Request: no valid session ID provided" },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
};

app.get("/mcp", auth.requireAuth, handleSessionRequest);
app.delete("/mcp", auth.requireAuth, handleSessionRequest);

app.get("/", (_req, res) => {
  res.json({
    name: "apollo-mcp-server",
    status: "ok",
    endpoint: "/mcp",
    transport: "Streamable HTTP",
    auth: auth.enabled ? "OAuth 2.0 (authorization_code + PKCE)" : "none (open)",
  });
});

app.listen(PORT, () => {
  console.log(`Apollo MCP server listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  if (!process.env.APOLLO_API_KEY) {
    console.warn("⚠️  APOLLO_API_KEY is not set — tool calls will fail until you set it.");
  }
});
