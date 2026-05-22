# Apollo MCP Server

An **MCP (Model Context Protocol) server** that exposes [Apollo.io](https://www.apollo.io)'s REST API to AI assistants (Claude Desktop, Claude.ai web, Cursor, ChatGPT desktop, etc.).

Instead of manually clicking through Apollo's UI, ask an AI:

> *"Find 50 marketing directors at SaaS companies in Australia with 50–200 employees and enrich the top 10 with verified emails."*

…and the AI calls this MCP server's tools and returns the result.

## Available Tools

### People
- `apollo_search_people` — Search 230M+ people by title, location, industry, company size, etc.
- `apollo_get_top_people_at_company` — Get key decision-makers at a known company
- `apollo_enrich_person` — Reveal verified email + phone for one person (uses credits)
- `apollo_bulk_enrich_people` — Enrich up to 10 people at once
- `apollo_get_person` — Get full profile for one Apollo person ID

### Companies (global database)
- `apollo_search_companies` — Search 30M+ companies by industry, size, revenue, tech stack
- `apollo_get_company` — Get full details for one Apollo organization ID
- `apollo_enrich_company` — Get firmographics by domain
- `apollo_bulk_enrich_companies` — Enrich up to 10 companies at once
- `apollo_get_company_job_postings` — Get a company's active job listings

### CRM Accounts (saved companies)
- `apollo_search_accounts` — Search your saved accounts
- `apollo_create_account` — Save a company to your CRM
- `apollo_update_account` — Update a saved company
- `apollo_bulk_create_accounts` — Bulk-save up to 25 companies
- `apollo_get_account_stages` — List account stages (Prospect, Engaged, etc.)
- `apollo_update_account_stage` — Move accounts between stages

### Lists
- `apollo_get_lists` — List all your saved lists/labels
- `apollo_create_list` — Create a new list
- `apollo_add_contacts_to_list` — Add contacts to a list
- `apollo_remove_contacts_from_list` — Remove contacts from a list

### Sequences
- `apollo_search_sequences` — Search outreach sequences
- `apollo_add_contacts_to_sequence` — Add contacts to a sequence
- `apollo_get_email_accounts` — List connected email accounts

### CRM Contacts
- `apollo_search_contacts` — Search your CRM contacts
- `apollo_create_contact` — Create a contact
- `apollo_update_contact` — Update a contact
- `apollo_get_contact_stages` — List contact stages
- `apollo_update_contact_stage` — Move contacts between stages

### Opportunities (Deals)
- `apollo_search_opportunities` — Search deals
- `apollo_create_opportunity` — Create a deal
- `apollo_update_opportunity` — Update a deal
- `apollo_get_opportunity_stages` — List deal stages

### Tasks
- `apollo_search_tasks` — Search tasks
- `apollo_create_tasks` — Create call/email/LinkedIn tasks for contacts

### Users & Signals
- `apollo_get_users` — List workspace team members
- `apollo_get_news_articles` — Get news for trigger-event outreach

## Setup

### 1. Get an Apollo API key

1. Log in to [app.apollo.io](https://app.apollo.io)
2. Go to **Settings → Integrations → API**: https://app.apollo.io/#/settings/integrations/api
3. Click **Create New API Key**
4. Toggle **"Set as master key"** (or check every endpoint scope)
5. Copy the key

### 2. Install + configure

```bash
cd apollo-mcp-server
npm install
cp .env.example .env
```

Edit `.env`:
```
APOLLO_API_KEY=your_key_here
PORT=3005
```

### 3. Run

```bash
# Dev (auto-reload)
npm run dev

# Production
npm run build
npm start
```

Server runs at `http://localhost:3005/mcp`.

### 4. Tunnel via ngrok (for testing with Claude.ai)

```bash
ngrok http 3005
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok-free.app`).

### 5. Add to Claude

#### Option A — Claude.ai web (custom integrations)
1. Go to Settings → Connectors → **Add custom integration**
2. URL: `https://abc123.ngrok-free.app/mcp`
3. Save and enable

#### Option B — Claude Desktop / Claude Code
Add to your MCP config (`~/.claude/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "apollo": {
      "url": "https://abc123.ngrok-free.app/mcp"
    }
  }
}
```

## Plan Limits

| Capability | Free | Basic ($49) | Professional ($79) | Organization ($119) |
|---|---|---|---|---|
| Company search & enrich | ✅ | ✅ | ✅ | ✅ |
| Top people at company | ✅ | ✅ | ✅ | ✅ |
| Global people search | ❌ | ✅ | ✅ | ✅ |
| Person enrichment (email/phone) | ❌ | ✅ | ✅ | ✅ |
| Bulk enrichment | ❌ | limited | ✅ | ✅ |
| Sequences | ❌ | limited | ✅ | ✅ |
| Lists / Contacts / Accounts CRUD | ✅ | ✅ | ✅ | ✅ |
| Custom reports, SSO, intl. dialer | ❌ | ❌ | ❌ | ✅ |

Endpoints that aren't on your plan return a "plan upgrade required" error — the MCP surfaces it directly to the AI client.

## Credits

| Plan | Monthly credits | Annual credits |
|---|---|---|
| Free | ~90/seat | 900/seat |
| Basic | ~2,500/seat | 30,000/seat |
| Professional | 4,000/seat | 48,000/seat |
| Organization | 6,000/seat | 72,000/seat |

- Search itself: usually free
- Person enrichment: 1 credit per reveal
- Phone number reveal: 8× credits
- Bulk enrichment: same per-record cost

## Project Structure

```
apollo-mcp-server/
├── src/
│   ├── index.ts                # Express + Streamable HTTP transport
│   ├── server.ts               # McpServer factory
│   ├── apollo/
│   │   └── client.ts           # Axios wrapper with auth
│   ├── tools/
│   │   ├── index.ts            # Registers all tools
│   │   ├── people.ts
│   │   ├── companies.ts
│   │   ├── accounts.ts
│   │   ├── lists.ts
│   │   ├── sequences.ts
│   │   ├── contacts.ts
│   │   ├── opportunities.ts
│   │   ├── tasks.ts
│   │   └── users.ts
│   └── util/
│       └── response.ts
├── scripts/
│   ├── test-key.ts             # Direct Apollo API sanity test
│   └── test-mcp.ts             # End-to-end MCP protocol test
├── .env.example
├── package.json
└── tsconfig.json
```
