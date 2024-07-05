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

describe("Course resolvers", () => {
  it("fetches a single course by id", async () => {
    const result = await server.executeOperation(
      {
        query: `query GetCourse($id: ID!) {
          course(id: $id) {
            id
            title
            code
            credits
          }
        }`,
        variables: { id: "course-1" },
      },
      { contextValue: createContext() },
    );

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, Record<string, unknown>>;
      expect(data.course.id).toBe("course-1");
      expect(data.course.title).toBe("Introduction to Machine Learning");
      expect(data.course.code).toBe("CS229");
    }
  });

  it("returns error for non-existent course", async () => {
    const result = await server.executeOperation(
      {
        query: `query { course(id: "nonexistent") { id } }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].extensions?.code).toBe("NOT_FOUND");
    }
  });

  it("fetches courses list with pagination", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          courses(limit: 3, offset: 0) {
            data { id title }
            total
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { data: unknown[]; total: number }>;
      expect(data.courses.data).toHaveLength(3);
      expect(data.courses.total).toBeGreaterThan(3);
    }
  });

  it("resolves nested professor on a course", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          course(id: "course-1") {
            id
            professor {
              id
              name
              specialization
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { professor: { id: string; name: string } }>;
      expect(data.course.professor.id).toBe("prof-1");
      expect(data.course.professor.name).toBe("Dr. Elena Vasquez");
    }
  });

  it("resolves nested department on a course", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          course(id: "course-1") {
            department {
              id
              name
              code
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { department: { id: string; code: string } }>;
      expect(data.course.department.id).toBe("dept-1");
      expect(data.course.department.code).toBe("CS");
    }
  });

  it("filters courses by departmentId", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          courses(departmentId: "dept-2") {
            data { id departmentId: code }
            total
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { data: unknown[]; total: number }>;
      expect(data.courses.total).toBeGreaterThanOrEqual(1);
    }
  });
});
