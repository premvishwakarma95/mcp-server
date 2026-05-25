import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

type TokenEntry = { expiresAt: number };
type CodeEntry = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope?: string;
  expiresAt: number;
};

const tokenStore = new Map<string, TokenEntry>();
const codeStore = new Map<string, CodeEntry>();

const TOKEN_TTL = 3600;
const CODE_TTL = 300;

function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function pkceVerify(verifier: string, challenge: string, method: string): boolean {
  if (method !== "S256") return false;
  const hash = createHash("sha256").update(verifier).digest("base64url");
  return safeEqual(hash, challenge);
}

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of tokenStore) if (v.expiresAt < now) tokenStore.delete(k);
  for (const [k, v] of codeStore) if (v.expiresAt < now) codeStore.delete(k);
}

export type Auth = {
  enabled: boolean;
  requireAuth: (req: Request, res: Response, next: NextFunction) => void;
};

export function setupOAuth(app: Express): Auth {
  const CLIENT_ID = process.env.MCP_CLIENT_ID;
  const CLIENT_SECRET = process.env.MCP_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn(
      "⚠️  MCP_CLIENT_ID / MCP_CLIENT_SECRET not set — OAuth disabled (server is OPEN)"
    );
    return { enabled: false, requireAuth: (_req, _res, next) => next() };
  }

  console.log("🔒 OAuth enabled — clients must authenticate to use /mcp");

  app.get("/.well-known/oauth-authorization-server", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    res.json({
      issuer: base,
      authorization_endpoint: `${base}/authorize`,
      token_endpoint: `${base}/oauth/token`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "client_credentials"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "client_secret_post",
        "client_secret_basic",
      ],
      scopes_supported: ["mcp"],
    });
  });

  app.get("/.well-known/oauth-protected-resource", (req, res) => {
    const base = `${req.protocol}://${req.get("host")}`;
    res.json({
      resource: `${base}/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    });
  });

  app.get("/authorize", (req: Request, res: Response) => {
    const {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
      scope,
    } = req.query as Record<string, string>;

    if (response_type !== "code") {
      res.status(400).send("unsupported response_type — must be 'code'");
      return;
    }
    if (!client_id || !safeEqual(client_id, CLIENT_ID)) {
      res.status(401).send("invalid client_id");
      return;
    }
    if (!redirect_uri) {
      res.status(400).send("redirect_uri required");
      return;
    }
    if (!code_challenge || code_challenge_method !== "S256") {
      res.status(400).send("PKCE with S256 is required");
      return;
    }

    pruneExpired();
    const code = generateToken(32);
    codeStore.set(code, {
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scope,
      expiresAt: Date.now() + CODE_TTL * 1000,
    });

    const target = new URL(redirect_uri);
    target.searchParams.set("code", code);
    if (state) target.searchParams.set("state", state);
    res.redirect(target.toString());
  });

  app.post(
    "/oauth/token",
    express.urlencoded({ extended: true }),
    express.json(),
    (req: Request, res: Response) => {
      const body = (req.body || {}) as Record<string, string>;

      let clientId = body.client_id;
      let clientSecret = body.client_secret;
      const authHeader = req.headers.authorization;
      if (!clientId && authHeader?.startsWith("Basic ")) {
        try {
          const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
          const idx = decoded.indexOf(":");
          if (idx >= 0) {
            clientId = decoded.slice(0, idx);
            clientSecret = decoded.slice(idx + 1);
          }
        } catch {
          /* ignore */
        }
      }

      const grantType = body.grant_type;
      pruneExpired();

      if (grantType === "authorization_code") {
        const { code, redirect_uri, code_verifier } = body;
        if (!code || !redirect_uri || !code_verifier) {
          res.status(400).json({ error: "invalid_request" });
          return;
        }
        if (!clientId || !clientSecret) {
          res.status(401).json({
            error: "invalid_client",
            error_description: "client_id and client_secret are required",
          });
          return;
        }
        if (
          !safeEqual(clientId, CLIENT_ID) ||
          !safeEqual(clientSecret, CLIENT_SECRET)
        ) {
          res.status(401).json({ error: "invalid_client" });
          return;
        }
        const entry = codeStore.get(code);
        if (!entry) {
          res.status(400).json({ error: "invalid_grant" });
          return;
        }
        if (entry.expiresAt < Date.now()) {
          codeStore.delete(code);
          res.status(400).json({ error: "invalid_grant", error_description: "expired" });
          return;
        }
        if (!safeEqual(entry.client_id, clientId)) {
          res.status(400).json({ error: "invalid_grant", error_description: "client mismatch" });
          return;
        }
        if (!safeEqual(entry.redirect_uri, redirect_uri)) {
          res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
          return;
        }
        if (!pkceVerify(code_verifier, entry.code_challenge, entry.code_challenge_method)) {
          res.status(400).json({ error: "invalid_grant", error_description: "PKCE failed" });
          return;
        }

        codeStore.delete(code);
        const token = generateToken();
        tokenStore.set(token, { expiresAt: Date.now() + TOKEN_TTL * 1000 });
        res.json({
          access_token: token,
          token_type: "Bearer",
          expires_in: TOKEN_TTL,
          scope: entry.scope || "mcp",
        });
        return;
      }

      if (grantType === "client_credentials") {
        if (
          !clientId ||
          !clientSecret ||
          !safeEqual(clientId, CLIENT_ID) ||
          !safeEqual(clientSecret, CLIENT_SECRET)
        ) {
          res.status(401).json({ error: "invalid_client" });
          return;
        }
        const token = generateToken();
        tokenStore.set(token, { expiresAt: Date.now() + TOKEN_TTL * 1000 });
        res.json({
          access_token: token,
          token_type: "Bearer",
          expires_in: TOKEN_TTL,
          scope: "mcp",
        });
        return;
      }

      res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Use authorization_code (PKCE) or client_credentials",
      });
    }
  );

  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      const base = `${req.protocol}://${req.get("host")}`;
      res.set(
        "WWW-Authenticate",
        `Bearer realm="mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`
      );
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const token = authHeader.slice(7).trim();
    const entry = tokenStore.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) tokenStore.delete(token);
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    next();
  };

  return { enabled: true, requireAuth };
}
