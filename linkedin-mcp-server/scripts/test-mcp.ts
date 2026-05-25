import "dotenv/config";
import axios from "axios";

const MCP_URL = process.env.MCP_URL || "http://localhost:3006/mcp";
const ACCEPT = "application/json, text/event-stream";
const CLIENT_ID = process.env.MCP_CLIENT_ID;
const CLIENT_SECRET = process.env.MCP_CLIENT_SECRET;

let bearerToken: string | undefined;

async function getBearerToken(): Promise<string | undefined> {
  if (!CLIENT_ID || !CLIENT_SECRET) return undefined;
  const tokenUrl = MCP_URL.replace(/\/mcp$/, "/oauth/token");
  const res = await axios.post(
    tokenUrl,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
  );
  return res.data.access_token;
}

function parseMcpResponse(body: any): any {
  if (typeof body !== "string") return body;
  const dataLines = body
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim());
  if (dataLines.length === 0) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
}

async function rpc(method: string, params: any, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: ACCEPT,
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;

  const res = await axios.post(
    MCP_URL,
    { jsonrpc: "2.0", id: Date.now(), method, params },
    { headers, transformResponse: [(d) => d] }
  );
  return {
    data: parseMcpResponse(res.data),
    sessionId: (res.headers["mcp-session-id"] as string) || sessionId,
  };
}

(async () => {
  console.log(`Testing LinkedIn MCP server at ${MCP_URL}\n`);

  if (CLIENT_ID && CLIENT_SECRET) {
    console.log("0. Authenticating via OAuth client_credentials");
    bearerToken = await getBearerToken();
    console.log(`   ✅ Got Bearer token`);
  }

  console.log("\n1. Initialize session");
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "linkedin-mcp-test", version: "0.1.0" },
  });
  const sid = init.sessionId;
  console.log(`   ✅ Server: ${init.data?.result?.serverInfo?.name}`);

  const notifHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: ACCEPT,
    "mcp-session-id": sid!,
  };
  if (bearerToken) notifHeaders["Authorization"] = `Bearer ${bearerToken}`;
  await axios.post(
    MCP_URL,
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    { headers: notifHeaders }
  );

  console.log("\n2. List tools");
  const tools = await rpc("tools/list", {}, sid);
  const toolList = tools.data?.result?.tools || [];
  console.log(`   ✅ ${toolList.length} tools exposed`);

  console.log("\n3. Call linkedin_list_accounts");
  const accounts = await rpc(
    "tools/call",
    { name: "linkedin_list_accounts", arguments: {} },
    sid
  );
  const content = accounts.data?.result?.content?.[0]?.text;
  if (!content) {
    console.log("   ❌ No content returned");
    process.exit(1);
  }
  const parsed = JSON.parse(content);
  const items = parsed.items || parsed.data || parsed;
  const list = Array.isArray(items) ? items : [];
  console.log(`   ✅ ${list.length} account(s):`);
  let accountId: string | undefined;
  for (const a of list) {
    console.log(`     - ${a.type} | id: ${a.id}`);
    if (a.type === "LINKEDIN" && !accountId) accountId = a.id;
  }

  if (!accountId) {
    console.log("\n⚠️  No LinkedIn account found — can't test profile tools");
    process.exit(0);
  }

  console.log(`\n4. Call linkedin_get_my_profile (account_id=${accountId})`);
  const me = await rpc(
    "tools/call",
    { name: "linkedin_get_my_profile", arguments: { account_id: accountId } },
    sid
  );
  const meText = me.data?.result?.content?.[0]?.text;
  if (meText) {
    const meData = JSON.parse(meText);
    if (meData.error) {
      console.log("   ⚠️ Tool returned error:", meData.error);
    } else {
      console.log("   ✅ My profile:");
      console.log(`     - first_name: ${meData.first_name || "?"}`);
      console.log(`     - last_name:  ${meData.last_name || "?"}`);
      console.log(`     - headline:   ${meData.headline || "?"}`);
      console.log(`     - location:   ${meData.location || "?"}`);
    }
  }

  console.log("\n🎉 End-to-end MCP test complete");
  process.exit(0);
})().catch((err) => {
  console.error("\n❌ Test failed:");
  if (err.response) {
    console.error(`  HTTP ${err.response.status}`);
    console.error("  Body:", err.response.data);
  } else {
    console.error(`  ${err.message}`);
  }
  process.exit(1);
});
