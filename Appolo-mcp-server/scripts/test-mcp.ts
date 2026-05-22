import axios from "axios";

const MCP_URL = process.env.MCP_URL || "http://localhost:3005/mcp";

const ACCEPT = "application/json, text/event-stream";

// Apollo's responses are wrapped in SSE-style "event:..." + "data:..." blocks
// when Accept includes text/event-stream. Parse out the JSON.
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

async function rpc(
  method: string,
  params: any,
  sessionId?: string
): Promise<{ data: any; sessionId: string | undefined }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: ACCEPT,
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

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
  console.log(`Testing MCP server at ${MCP_URL}\n`);

  // 1) Initialize the MCP session
  console.log("1. Initializing session...");
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "apollo-mcp-test", version: "0.1.0" },
  });
  const sid = init.sessionId;
  console.log(`   ✅ Server: ${init.data?.result?.serverInfo?.name}`);
  console.log(`   Session ID: ${sid}\n`);

  // 2) Tell server we're ready (required notification)
  await axios.post(
    MCP_URL,
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: ACCEPT,
        "mcp-session-id": sid!,
      },
    }
  );

  // 3) List tools
  console.log("2. Listing tools...");
  const tools = await rpc("tools/list", {}, sid);
  const toolList = tools.data?.result?.tools || [];
  console.log(`   ✅ ${toolList.length} tools exposed`);
  for (const t of toolList.slice(0, 5)) {
    console.log(`     - ${t.name}`);
  }
  console.log(`     ... and ${Math.max(0, toolList.length - 5)} more\n`);

  // 4) Call a tool — apollo_search_companies for "Apollo"
  console.log("3. Calling tool: apollo_search_companies (q_organization_name='Apollo')...");
  const call = await rpc(
    "tools/call",
    {
      name: "apollo_search_companies",
      arguments: { q_organization_name: "Apollo", per_page: 3 },
    },
    sid
  );
  const content = call.data?.result?.content?.[0]?.text;
  if (!content) {
    console.log("   ❌ Unexpected response:", JSON.stringify(call.data, null, 2));
    process.exit(1);
  }
  const parsed = JSON.parse(content);
  const orgs = parsed.organizations || parsed.accounts || [];
  console.log(`   ✅ Got ${orgs.length} companies back:`);
  for (const o of orgs.slice(0, 3)) {
    console.log(`     - ${o.name} (${o.website_url || o.primary_domain || "n/a"})`);
  }

  // 5) Call enrich_company for apollo.io
  console.log("\n4. Calling tool: apollo_enrich_company (domain='apollo.io')...");
  const enrich = await rpc(
    "tools/call",
    {
      name: "apollo_enrich_company",
      arguments: { domain: "apollo.io" },
    },
    sid
  );
  const enrichText = enrich.data?.result?.content?.[0]?.text;
  if (enrichText) {
    const enrichData = JSON.parse(enrichText);
    const org = enrichData.organization || enrichData;
    console.log(`   ✅ Enriched: ${org.name || "Apollo"}`);
    console.log(`     Industry: ${org.industry || "?"}`);
    console.log(`     Size: ${org.estimated_num_employees || "?"} employees`);
    console.log(`     HQ: ${org.city || "?"}, ${org.country || "?"}`);
  }

  console.log("\n🎉 MCP server end-to-end test PASSED");
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
