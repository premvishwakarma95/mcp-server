import "dotenv/config";
import axios from "axios";

const URL = process.env.MCP_URL || "http://localhost:3005";
const CLIENT_ID = process.env.MCP_CLIENT_ID;
const CLIENT_SECRET = process.env.MCP_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Set MCP_CLIENT_ID and MCP_CLIENT_SECRET in .env first");
  process.exit(1);
}

async function test(label: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${label.padEnd(50, ".")} `);
  try {
    await fn();
    console.log("✅");
  } catch (e: any) {
    console.log(`❌ ${e.response?.status ?? ""} ${e.response?.data?.error ?? e.message}`);
  }
}

(async () => {
  console.log(`Testing OAuth flow against ${URL}\n`);

  await test("Discovery: /.well-known/oauth-authorization-server", async () => {
    const r = await axios.get(`${URL}/.well-known/oauth-authorization-server`);
    if (!r.data.token_endpoint) throw new Error("missing token_endpoint");
  });

  await test("Unauthenticated /mcp returns 401", async () => {
    try {
      await axios.post(`${URL}/mcp`, { jsonrpc: "2.0", id: 1, method: "initialize" });
      throw new Error("expected 401");
    } catch (e: any) {
      if (e.response?.status !== 401) throw e;
    }
  });

  await test("Token with wrong secret returns 401", async () => {
    try {
      await axios.post(
        `${URL}/oauth/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: CLIENT_ID,
          client_secret: "wrong",
        })
      );
      throw new Error("expected 401");
    } catch (e: any) {
      if (e.response?.status !== 401) throw e;
    }
  });

  let token: string | undefined;
  await test("Token with correct creds returns access_token", async () => {
    const r = await axios.post(
      `${URL}/oauth/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      })
    );
    if (!r.data.access_token) throw new Error("missing access_token");
    token = r.data.access_token;
  });

  await test("/mcp with Bearer token succeeds (initialize)", async () => {
    const r = await axios.post(
      `${URL}/mcp`,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "oauth-test", version: "0.1.0" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json, text/event-stream",
        },
      }
    );
    if (r.status !== 200) throw new Error(`got ${r.status}`);
  });

  console.log("\n🎉 OAuth flow verified end-to-end");
})();
