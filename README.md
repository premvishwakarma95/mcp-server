# Simple MCP Server (Node.js) — Ready to Connect With AI Clients

This guide shows how to create a basic MCP (Model Context Protocol) server using Node.js.

You can connect this server to AI tools/clients that support MCP.

---

# What is MCP?

MCP (Model Context Protocol) is a protocol that allows AI models to:

* Use tools
* Access APIs
* Read files
* Execute actions
* Fetch external data
* Interact with databases/services

Think of it like:

> "An API layer specifically designed for AI agents/models."

Popular AI clients that support MCP:

* Claude Desktop
* Cursor
* VS Code AI extensions
* Custom AI agents
* OpenAI compatible agent frameworks

---

# Project Structure

```bash
mcp-server/
│
├── package.json
├── server.js
└── .env
```

---

# Step 1 — Create Project

```bash
mkdir mcp-server
cd mcp-server
npm init -y
```

---

# Step 2 — Install Dependencies

```bash
npm install @modelcontextprotocol/sdk zod dotenv
```

---

# Step 3 — Create server.js

```js
require('dotenv').config();

const {
  McpServer,
} = require('@modelcontextprotocol/sdk/server/mcp.js');

const {
  StdioServerTransport,
} = require('@modelcontextprotocol/sdk/server/stdio.js');

const { z } = require('zod');

// Create MCP Server
const server = new McpServer({
  name: 'prem-mcp-server',
  version: '1.0.0',
});

/**
 * TOOL 1
 * Simple calculator tool
 */
server.tool(
  'addNumbers',
  {
    a: z.number(),
    b: z.number(),
  },
  async ({ a, b }) => {
    return {
      content: [
        {
          type: 'text',
          text: `Result: ${a + b}`,
        },
      ],
    };
  }
);

/**
 * TOOL 2
 * Current time tool
 */
server.tool(
  'getCurrentTime',
  {},
  async () => {
    return {
      content: [
        {
          type: 'text',
          text: `Current Time: ${new Date().toISOString()}`,
        },
      ],
    };
  }
);

/**
 * TOOL 3
 * Fake user lookup
 */
server.tool(
  'getUser',
  {
    id: z.string(),
  },
  async ({ id }) => {
    const users = {
      '1': {
        id: '1',
        name: 'Prem',
        role: 'Developer',
      },
      '2': {
        id: '2',
        name: 'John',
        role: 'Admin',
      },
    };

    const user = users[id];

    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: 'User not found',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(user, null, 2),
        },
      ],
    };
  }
);

/**
 * Start Server
 */
async function startServer() {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('MCP Server Running...');
}

startServer();
```

---

# Step 4 — Add Start Script

Update package.json:

```json
{
  "name": "mcp-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

---

# Step 5 — Run MCP Server

```bash
npm start
```

You should see:

```bash
MCP Server Running...
```

---

# How AI Understands This MCP Server

The AI client automatically reads:

* Tool names
* Input schema
* Descriptions
* Responses

Example:

AI sees:

```js
addNumbers(a, b)
```

Then AI can call:

```json
{
  "a": 10,
  "b": 20
}
```

And receive:

```json
Result: 30
```

---

# Example Claude Desktop Configuration

Location:

```bash
Windows:
%APPDATA%\Claude\claude_desktop_config.json
```

Example config:

```json
{
  "mcpServers": {
    "prem-server": {
      "command": "node",
      "args": [
        "C:/full-path/mcp-server/server.js"
      ]
    }
  }
}
```

Restart Claude Desktop.

Your tools will appear automatically.

---

# Example Tools You Can Build

You can connect MCP with:

* MongoDB
* PostgreSQL
* Redis
* APIs
* File system
* Gmail
* WhatsApp
* Stripe
* GitHub
* Docker
* Kubernetes
* AWS
* AI agents

---

# MongoDB MCP Tool Example

```js
server.tool(
  'getTasks',
  {},
  async () => {
    const tasks = await Task.find().limit(5);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }
);
```

---

# HTTP API MCP Tool Example

```js
server.tool(
  'getWeather',
  {
    city: z.string(),
  },
  async ({ city }) => {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=KEY&q=${city}`
    );

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);
```

---

# Important MCP Concepts

## 1. Tool

A function AI can execute.

Example:

```js
server.tool('toolName', schema, handler)
```

---

## 2. Schema

Defines expected input.

Example:

```js
{
  city: z.string()
}
```

---

## 3. Transport

How client communicates.

Common transports:

* stdio
* websocket
* http

This tutorial uses:

```js
StdioServerTransport
```

---

## 4. Content Response

MCP tools return:

```js
{
  content: []
}
```

Usually text/json.

---

# Production Improvements

For real production servers add:

* Authentication
* Logging
* Error handling
* Rate limiting
* Validation
* Database pooling
* Streaming responses
* Tool permissions
* Retry logic

---

# Recommended Tech Stack for Advanced MCP Servers

Since you already know MERN stack, this is a good path:

## Beginner

* Basic MCP tools
* File tools
* Calculator tools
* MongoDB tools

## Intermediate

* Express APIs
* Redis caching
* BullMQ queues
* Authentication
* AI workflows

## Advanced

* Multi-agent systems
* Vector DB
* RAG
* Autonomous agents
* Tool orchestration
* Memory systems
* AI copilots

---

# Best MCP Use Cases

## AI Coding Assistant

AI can:

* Read codebase
* Create files
* Fix bugs
* Run commands

---

## AI Database Assistant

AI can:

* Query MongoDB
* Generate reports
* Analyze data
* Create dashboards

---

## AI DevOps Assistant

AI can:

* Deploy apps
* Restart servers
* Monitor logs
* Scale infrastructure

---

# Next Level

After this, learn:

1. MCP Resources
2. MCP Prompts
3. MCP Streaming
4. WebSocket transport
5. AI agents with MCP
6. Cursor MCP integration
7. Claude MCP integration
8. OpenAI tool calling
9. LangChain + MCP
10. Multi-tool orchestration

---

# Final Notes

This is a real working MCP server.

You can:

* Run it locally
* Connect AI clients
* Add your own tools
* Connect databases/APIs
* Build AI agents

This is currently one of the most important skills in AI engineering.
