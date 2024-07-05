import { Request, Response, NextFunction } from "express";
import { apiKeyAuth, extractApiKey, VALID_API_KEYS } from "../../src/middleware/auth";

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    path: "/graphql",
    ...overrides,
  } as Request;
}

function createMockRes(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  } as Response & { statusCode: number; body: unknown };
  return res;
}

describe("extractApiKey", () => {
  it("extracts key from Bearer token", () => {
    expect(extractApiKey("Bearer sk-gateway-dev-001")).toBe("sk-gateway-dev-001");
  });

  it("extracts raw key without Bearer prefix", () => {
    expect(extractApiKey("sk-gateway-dev-001")).toBe("sk-gateway-dev-001");
  });

  it("returns null for undefined header", () => {
    expect(extractApiKey(undefined)).toBeNull();
  });

  it("trims whitespace", () => {
    expect(extractApiKey("Bearer  sk-gateway-dev-001 ")).toBe("sk-gateway-dev-001");
  });
});

describe("apiKeyAuth middleware", () => {
  it("passes through for public /health path", () => {
    const req = createMockReq({ path: "/health" });
    const res = createMockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("passes through for /api paths", () => {
    const req = createMockReq({ path: "/api/courses" });
    const res = createMockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects requests without Authorization header", () => {
    const req = createMockReq({ path: "/graphql" });
    const res = createMockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      errors: [{ message: "Missing Authorization header", extensions: { code: "UNAUTHENTICATED" } }],
    });
  });

  it("rejects requests with invalid API key", () => {
    const req = createMockReq({
      path: "/graphql",
      headers: { authorization: "Bearer invalid-key" } as Record<string, string>,
    });
    const res = createMockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("allows requests with valid API key and sets clientId", () => {
    const req = createMockReq({
      path: "/graphql",
      headers: { authorization: "Bearer sk-gateway-dev-001" } as Record<string, string>,
    });
    const res = createMockRes();
    const next = jest.fn();

    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as Request & { clientId: string }).clientId).toBe("sk-gateway-dev-001");
  });

  it("accepts all configured valid keys", () => {
    for (const key of VALID_API_KEYS) {
      const req = createMockReq({
        path: "/graphql",
        headers: { authorization: `Bearer ${key}` } as Record<string, string>,
      });
      const res = createMockRes();
      const next: NextFunction = jest.fn();

      apiKeyAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });
});
