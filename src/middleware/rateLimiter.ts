import { Request, Response, NextFunction } from "express";
import { RateLimitError } from "../types";

interface SlidingWindowEntry {
  timestamp: number;
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  windowMs: 60_000,
  maxRequests: 100,
};

export class SlidingWindowRateLimiter {
  private windows: Map<string, SlidingWindowEntry[]> = new Map();
  private readonly config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isAllowed(clientId: string): { allowed: boolean; retryAfterMs: number; remaining: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entries = this.windows.get(clientId) ?? [];
    entries = entries.filter((e) => e.timestamp > windowStart);

    if (entries.length >= this.config.maxRequests) {
      const oldestInWindow = entries[0].timestamp;
      const retryAfterMs = oldestInWindow + this.config.windowMs - now;
      this.windows.set(clientId, entries);

      return { allowed: false, retryAfterMs, remaining: 0 };
    }

    entries.push({ timestamp: now });
    this.windows.set(clientId, entries);

    return {
      allowed: true,
      retryAfterMs: 0,
      remaining: this.config.maxRequests - entries.length,
    };
  }

  reset(clientId?: string): void {
    if (clientId) {
      this.windows.delete(clientId);
    } else {
      this.windows.clear();
    }
  }

  getConfig(): Readonly<RateLimiterConfig> {
    return { ...this.config };
  }
}

export function createRateLimiterMiddleware(
  config: Partial<RateLimiterConfig> = {},
): { middleware: (req: Request, res: Response, next: NextFunction) => void; limiter: SlidingWindowRateLimiter } {
  const limiter = new SlidingWindowRateLimiter(config);

  function middleware(req: Request, res: Response, next: NextFunction): void {
    const clientId =
      (req as Request & { clientId?: string }).clientId ??
      req.ip ??
      "anonymous";

    const result = limiter.isAllowed(clientId);

    res.setHeader("X-RateLimit-Limit", limiter.getConfig().maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000));
      const error = new RateLimitError(result.retryAfterMs);
      res.status(429).json({
        errors: [
          {
            message: error.message,
            extensions: {
              code: error.code,
              retryAfterMs: result.retryAfterMs,
            },
          },
        ],
      });
      return;
    }

    next();
  }

  return { middleware, limiter };
}
