import { SlidingWindowRateLimiter } from "../../src/middleware/rateLimiter";

describe("SlidingWindowRateLimiter", () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 1000,
      maxRequests: 5,
    });
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter.isAllowed("client-1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it("blocks requests that exceed the limit", () => {
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed("client-1");
    }

    const result = limiter.isAllowed("client-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks clients independently", () => {
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed("client-1");
    }

    const result = limiter.isAllowed("client-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows requests again after window expires", async () => {
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed("client-1");
    }
    expect(limiter.isAllowed("client-1").allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = limiter.isAllowed("client-1");
    expect(result.allowed).toBe(true);
  });

  it("reset clears a specific client", () => {
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed("client-1");
    }
    expect(limiter.isAllowed("client-1").allowed).toBe(false);

    limiter.reset("client-1");
    expect(limiter.isAllowed("client-1").allowed).toBe(true);
  });

  it("reset without argument clears all clients", () => {
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed("client-1");
      limiter.isAllowed("client-2");
    }

    limiter.reset();
    expect(limiter.isAllowed("client-1").allowed).toBe(true);
    expect(limiter.isAllowed("client-2").allowed).toBe(true);
  });

  it("getConfig returns the configuration", () => {
    const config = limiter.getConfig();
    expect(config.windowMs).toBe(1000);
    expect(config.maxRequests).toBe(5);
  });

  it("provides accurate remaining count", () => {
    expect(limiter.isAllowed("client-1").remaining).toBe(4);
    expect(limiter.isAllowed("client-1").remaining).toBe(3);
    expect(limiter.isAllowed("client-1").remaining).toBe(2);
  });

  it("sliding window evicts old entries", async () => {
    limiter.isAllowed("client-1");
    limiter.isAllowed("client-1");
    limiter.isAllowed("client-1");

    await new Promise((resolve) => setTimeout(resolve, 600));

    limiter.isAllowed("client-1");
    limiter.isAllowed("client-1");

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = limiter.isAllowed("client-1");
    expect(result.allowed).toBe(true);
  });
});
