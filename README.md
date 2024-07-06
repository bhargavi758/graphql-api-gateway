# graphql-api-gateway

GraphQL gateway that wraps multiple REST APIs into one schema. Uses DataLoader to batch requests so you don't get N+1 problems.

The REST APIs are mocked as Express routes on the same server, but data sources call them over HTTP (axios) — same pattern as if they were separate services.

## run

```bash
npm install
npm run dev
```

Port 4000. Needs a key in the `Authorization` header:

```
Authorization: Bearer sk-gateway-dev-001
```

Dev keys: `sk-gateway-dev-001`, `sk-gateway-dev-002`, `sk-gateway-test-key`

## schema

Courses, Professors, Departments, Events — all wired together with relationships. Standard university domain stuff.

## tests

```bash
npm test
```

## tech

TypeScript, Apollo Server 4, Express, DataLoader, in-memory TTL cache, sliding window rate limiter
