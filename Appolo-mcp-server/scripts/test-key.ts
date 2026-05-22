import "dotenv/config";
import axios from "axios";

const apiKey = process.env.APOLLO_API_KEY;
if (!apiKey) {
  console.error("❌ APOLLO_API_KEY not set in .env");
  process.exit(1);
}

const http = axios.create({
  baseURL: "https://api.apollo.io",
  headers: {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  },
  timeout: 30_000,
});

async function test(label: string, method: "get" | "post", path: string, body?: any) {
  process.stdout.write(`  ${label.padEnd(48, ".")} `);
  try {
    const res =
      method === "get"
        ? await http.get(path, { params: body })
        : await http.post(path, body);
    console.log(`✅ HTTP ${res.status}`);
    return res.data;
  } catch (err: any) {
    const status = err.response?.status ?? "?";
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      JSON.stringify(err.response?.data) ||
      err.message;
    console.log(`❌ HTTP ${status} — ${msg}`);
    return null;
  }
}

(async () => {
  console.log("Testing Apollo API endpoints (Basic plan):\n");

  console.log("Search endpoints (no credits):");
  await test(
    "mixed_companies/search (was paid)",
    "post",
    "/api/v1/mixed_companies/search",
    { q_organization_name: "Microsoft", per_page: 2 }
  );
  await test(
    "mixed_people/api_search (was paid)",
    "post",
    "/api/v1/mixed_people/api_search",
    { person_titles: ["CEO"], q_organization_domains: ["microsoft.com"], per_page: 2 }
  );
  await test(
    "organizations/search (was free)",
    "post",
    "/api/v1/organizations/search",
    { q_organization_name: "Apollo", per_page: 2 }
  );

  console.log("\nEnrich endpoints (no credits used for valid responses):");
  await test(
    "organizations/enrich (was free)",
    "get",
    "/api/v1/organizations/enrich",
    { domain: "apollo.io" }
  );

  console.log("\nCRM endpoints:");
  await test("accounts/search", "post", "/api/v1/accounts/search", { per_page: 1 });
  await test("contacts/search", "post", "/api/v1/contacts/search", { per_page: 1 });
  await test("contact_stages", "get", "/api/v1/contact_stages");
  await test("account_stages", "get", "/api/v1/account_stages");

  console.log("\nOther:");
  await test("users/search", "get", "/api/v1/users/search");
  await test("labels", "get", "/api/v1/labels");
  await test(
    "emailer_campaigns/search (sequences)",
    "post",
    "/api/v1/emailer_campaigns/search",
    { per_page: 1 }
  );

  console.log("\nDone. ❌ rows are endpoints not available on your plan.");
})();
