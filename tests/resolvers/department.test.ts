import { ApolloServer } from "@apollo/server";
import express from "express";
import http from "http";
import { typeDefs } from "../../src/graphql/schema";
import { resolvers } from "../../src/graphql/resolvers";
import { createLoaders, DataSources } from "../../src/graphql/dataloaders";
import { CourseAPI } from "../../src/datasources/CourseAPI";
import { ProfessorAPI } from "../../src/datasources/ProfessorAPI";
import { DepartmentAPI } from "../../src/datasources/DepartmentAPI";
import { EventAPI } from "../../src/datasources/EventAPI";
import { InMemoryCache } from "../../src/cache/InMemoryCache";
import { createMockApiRouter } from "../../src/mock-apis/router";
import { GraphQLContext } from "../../src/types";

let httpServer: http.Server;
let server: ApolloServer<GraphQLContext>;
let dataSources: DataSources;
let cache: InMemoryCache;
let baseURL: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", createMockApiRouter());

  await new Promise<void>((resolve) => {
    httpServer = app.listen(0, () => {
      const addr = httpServer.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      baseURL = `http://localhost:${port}/api`;
      resolve();
    });
  });

  cache = new InMemoryCache({ cleanupIntervalMs: 0 });

  dataSources = {
    courseAPI: new CourseAPI(baseURL, cache),
    professorAPI: new ProfessorAPI(baseURL, cache),
    departmentAPI: new DepartmentAPI(baseURL, cache),
    eventAPI: new EventAPI(baseURL, cache),
  };

  server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
  await server.start();
});

afterAll(async () => {
  await server.stop();
  cache.destroy();
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
});

afterEach(() => {
  cache.clear();
});

function createContext(): GraphQLContext {
  return {
    dataloaders: createLoaders(dataSources),
    dataSources,
    clientId: "test-client",
  };
}

describe("Department resolvers", () => {
  it("fetches a single department by id", async () => {
    const result = await server.executeOperation(
      {
        query: `query GetDepartment($id: ID!) {
          department(id: $id) {
            id
            name
            code
            building
          }
        }`,
        variables: { id: "dept-1" },
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, Record<string, unknown>>;
      expect(data.department.id).toBe("dept-1");
      expect(data.department.name).toBe("Computer Science");
      expect(data.department.code).toBe("CS");
    }
  });

  it("returns error for non-existent department", async () => {
    const result = await server.executeOperation(
      {
        query: `query { department(id: "nonexistent") { id } }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].extensions?.code).toBe("NOT_FOUND");
    }
  });

  it("fetches all departments", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          departments {
            data { id name code }
            total
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { data: unknown[]; total: number }>;
      expect(data.departments.data.length).toBeGreaterThanOrEqual(5);
      expect(data.departments.total).toBe(5);
    }
  });

  it("resolves head of department", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          department(id: "dept-1") {
            head {
              id
              name
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { head: { id: string; name: string } }>;
      expect(data.department.head.id).toBe("prof-1");
    }
  });

  it("resolves professors in a department", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          department(id: "dept-1") {
            professors {
              id
              name
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { professors: { id: string }[] }>;
      expect(data.department.professors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("resolves courses in a department", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          department(id: "dept-1") {
            courses {
              id
              title
              code
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { courses: { id: string }[] }>;
      expect(data.department.courses.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("resolves events in a department", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          department(id: "dept-1") {
            events {
              id
              title
              type
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { events: { id: string }[] }>;
      expect(data.department.events.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("handles deeply nested queries (department -> professors -> courses)", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          department(id: "dept-1") {
            name
            professors {
              name
              courses {
                title
                code
              }
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, {
        name: string;
        professors: { name: string; courses: { title: string }[] }[];
      }>;
      expect(data.department.name).toBe("Computer Science");
      expect(data.department.professors.length).toBeGreaterThanOrEqual(1);
      const withCourses = data.department.professors.filter((p) => p.courses.length > 0);
      expect(withCourses.length).toBeGreaterThanOrEqual(1);
    }
  });
});
