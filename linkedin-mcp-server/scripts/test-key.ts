import "dotenv/config";
import axios from "axios";

const dsn = process.env.UNIPILE_DSN;
const token = process.env.UNIPILE_ACCESS_TOKEN;

if (!dsn || !token) {
  console.error("❌ UNIPILE_DSN or UNIPILE_ACCESS_TOKEN not set in .env");
  process.exit(1);
}

const baseURL = dsn.startsWith("http") ? dsn : `https://${dsn}`;
const http = axios.create({
  baseURL,
  headers: {
    "X-API-KEY": token,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

async function test(label: string, fn: () => Promise<any>) {
  process.stdout.write(`  ${label.padEnd(40, ".")} `);
  try {
    const data = await fn();
    console.log("✅");
    return data;
  } catch (e: any) {
    const status = e.response?.status;
    const body = e.response?.data;
    const msg = body?.title || body?.detail || body?.message || e.message;
    console.log(`❌ HTTP ${status ?? "?"} — ${msg}`);
    if (body) console.log("       Body:", JSON.stringify(body).slice(0, 200));
    return null;
  }
}

(async () => {
  console.log(`Testing Unipile API at ${baseURL}\n`);

  const accounts = await test("List connected accounts", async () => {
    return (await http.get("/api/v1/accounts")).data;
  });

  if (accounts) {
    const items = accounts.items || accounts.data || accounts;
    const list = Array.isArray(items) ? items : [];
    console.log(`     Found ${list.length} account(s):`);
    for (const a of list) {
      console.log(`       - ${a.type || "?"} | id: ${a.id} | status: ${a.status || a.connection_params?.status || "?"}`);
    }
  }

  console.log("\n  Note: If no accounts are listed, connect a LinkedIn account at https://dashboard.unipile.com");
})();
