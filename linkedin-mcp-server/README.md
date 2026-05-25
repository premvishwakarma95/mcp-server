# LinkedIn MCP Server

An **MCP (Model Context Protocol) server** that exposes LinkedIn (via [Unipile](https://www.unipile.com) as the backend) to AI assistants — Claude Desktop, Claude.ai, Cursor, etc.

Lets the AI search profiles, send connection requests, message contacts, and post — as if it were the user logged into LinkedIn Sales Navigator.

```
AI Client (Claude.ai)
   ↓
LinkedIn MCP Server (this project)
   ↓
Unipile API
   ↓
User's connected LinkedIn account
```

## Available Tools (~22)

### Accounts
- `linkedin_list_accounts` — list connected LinkedIn accounts
- `linkedin_get_account` — get account status
- `linkedin_resync_account` — trigger account resync

### Profiles
- `linkedin_get_profile` — get a person's profile by handle or URL
- `linkedin_get_company` — get a company's profile
- `linkedin_get_my_profile` — get the authenticated user's own profile
- `linkedin_get_relations` — list LinkedIn connections

### Search
- `linkedin_search` — search people/companies/posts/jobs with filters
- `linkedin_search_via_url` — search using a Sales Navigator URL

### Invitations
- `linkedin_send_invitation` — send a connection request (with optional note)
- `linkedin_list_invitations_sent` — list sent invitations
- `linkedin_list_invitations_received` — list received invitations
- `linkedin_cancel_invitation` — withdraw a sent invitation
- `linkedin_accept_invitation` — accept an incoming connection

### Messaging
- `linkedin_list_chats` — list LinkedIn conversations
- `linkedin_get_chat` — read a chat's messages
- `linkedin_start_chat` — start new chat or send InMail
- `linkedin_send_message` — send a message in an existing chat

### Posts
- `linkedin_list_posts` — list posts by a person or company
- `linkedin_get_post` — get details on one post
- `linkedin_create_post` — publish a new post
- `linkedin_comment_on_post` — comment on a post
- `linkedin_react_to_post` — react to a post (like, celebrate, etc.)

## Setup

### 1. Sign up for Unipile (free 7-day trial, no credit card)

1. Go to https://www.unipile.com → start free trial
2. After signup → https://dashboard.unipile.com
3. Copy your **DSN** (e.g. `api6.unipile.com:13670`) — visible in the dashboard
4. Generate an **Access Token** at https://dashboard.unipile.com/access-tokens

### 2. Connect your LinkedIn account in Unipile

In the Unipile dashboard:
- Click **Connect Account** → LinkedIn
- Either provide username/password OR paste your `li_at` cookie from a logged-in browser
- Note the `account_id` — you'll pass this to every tool call

### 3. Configure this project

```powershell
cd E:\linkedin-mcp-server
npm install
Copy-Item .env.example .env
notepad .env
```

Fill in:
```
UNIPILE_DSN=api6.unipile.com:13670
UNIPILE_ACCESS_TOKEN=your_access_token_here
PORT=3006
```

### 4. Run

```powershell
npm run dev
```

Server runs at `http://localhost:3006/mcp`.

### 5. Tunnel via ngrok

```powershell
ngrok http 3006
```

### 6. Add to Claude.ai

Settings → Connectors → Add custom connector:
- URL: `https://<your-ngrok-url>/mcp`
- (Optional) OAuth Client ID + Secret if you enabled them in `.env`

## Example prompts

> *"List my connected LinkedIn accounts."*

> *"Search LinkedIn for marketing directors at SaaS companies in Sydney. Show me 5."*

> *"Get the LinkedIn profile of satyanadella including their experience and education."*

> *"Send a connection request to person with provider_id ABC123 with the note 'Hi! Saw your post on AI agents — would love to connect.'"*

> *"List my unread LinkedIn chats."*

> *"Send a message in chat XYZ saying 'Thanks for connecting!'"*

> *"Create a LinkedIn post: 'Just built an MCP server that lets AI use Sales Navigator. The future is now.'"*

## ⚠️ LinkedIn safety guardrails

LinkedIn enforces strict daily limits per account. Going over them can get the account restricted. **Soft caps to respect:**

- Connection invitations: **~20 per day** (LinkedIn weekly cap is 100)
- InMails: as many as your subscription allows
- Profile views via search: ~80 unique profiles/day on free, ~500/day on Sales Nav
- Messages: no hard limit, but spamming flagged accounts gets restricted

The MCP server doesn't rate-limit you — that's your responsibility (or trust the AI to behave). Add prompt context like *"send no more than 5 invitations per day"* to keep behavior safe.

## Project Structure

```
linkedin-mcp-server/
├── src/
│   ├── index.ts                  # Express + Streamable HTTP transport
│   ├── server.ts                 # McpServer factory
│   ├── auth/
│   │   └── oauth.ts              # Optional OAuth 2.0 client gate
│   ├── unipile/
│   │   └── client.ts             # Axios wrapper for Unipile API
│   ├── tools/
│   │   ├── index.ts              # Registers all tools
│   │   ├── accounts.ts
│   │   ├── profiles.ts
│   │   ├── search.ts
│   │   ├── invitations.ts
│   │   ├── messaging.ts
│   │   └── posts.ts
│   └── util/response.ts
├── .env.example
├── package.json
└── tsconfig.json
```
