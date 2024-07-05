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

describe("Professor resolvers", () => {
  it("fetches a single professor by id", async () => {
    const result = await server.executeOperation(
      {
        query: `query GetProfessor($id: ID!) {
          professor(id: $id) {
            id
            name
            email
            title
            specialization
          }
        }`,
        variables: { id: "prof-1" },
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, Record<string, unknown>>;
      expect(data.professor.id).toBe("prof-1");
      expect(data.professor.name).toBe("Dr. Elena Vasquez");
      expect(data.professor.specialization).toBe("Machine Learning and Natural Language Processing");
    }
  });

  it("returns error for non-existent professor", async () => {
    const result = await server.executeOperation(
      {
        query: `query { professor(id: "nonexistent") { id } }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].extensions?.code).toBe("NOT_FOUND");
    }
  });

  it("fetches professors list", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          professors(limit: 5) {
            data { id name }
            total
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { data: unknown[]; total: number }>;
      expect(data.professors.data).toHaveLength(5);
      expect(data.professors.total).toBeGreaterThanOrEqual(5);
    }
  });

  it("resolves nested department on a professor", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          professor(id: "prof-1") {
            department {
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
      const data = result.body.singleResult.data as Record<string, { department: { id: string; name: string } }>;
      expect(data.professor.department.id).toBe("dept-1");
      expect(data.professor.department.name).toBe("Computer Science");
    }
  });

  it("resolves courses taught by a professor", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          professor(id: "prof-1") {
            courses {
              id
              title
            }
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { courses: { id: string }[] }>;
      expect(data.professor.courses.length).toBeGreaterThanOrEqual(1);
      data.professor.courses.forEach((course) => {
        expect(course.id).toBeDefined();
      });
    }
  });

  it("filters professors by department", async () => {
    const result = await server.executeOperation(
      {
        query: `query {
          professors(departmentId: "dept-1") {
            data { id name }
            total
          }
        }`,
      },
      { contextValue: createContext() },
    );

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as Record<string, { data: unknown[]; total: number }>;
      expect(data.professors.total).toBeGreaterThanOrEqual(1);
    }
  });
});
