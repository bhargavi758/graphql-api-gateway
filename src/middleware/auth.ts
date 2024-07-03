import { Request, Response, NextFunction } from "express";
import { AuthenticationError } from "../types";

const VALID_API_KEYS = new Set([
  "sk-gateway-dev-001",
  "sk-gateway-dev-002",
  "sk-gateway-test-key",
]);

const PUBLIC_PATHS = new Set(["/health", "/api"]);

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  for (const prefix of PUBLIC_PATHS) {
    if (path.startsWith(prefix + "/")) return true;
  }
  return false;
}

export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  if (isPublicPath(req.path)) {
    next();
    return;
  }

  const apiKey = extractApiKey(req.headers.authorization);

  if (!apiKey) {
    const error = new AuthenticationError("Missing Authorization header");
    res.status(401).json({
      errors: [{ message: error.message, extensions: { code: error.code } }],
    });
    return;
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    const error = new AuthenticationError("Invalid API key");
    res.status(401).json({
      errors: [{ message: error.message, extensions: { code: error.code } }],
    });
    return;
  }

  (req as Request & { clientId: string }).clientId = apiKey;
  next();
}

export { VALID_API_KEYS };
