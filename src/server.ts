import express, { Request, Response } from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createLoaders, DataSources } from "./graphql/dataloaders";
import { CourseAPI } from "./datasources/CourseAPI";
import { ProfessorAPI } from "./datasources/ProfessorAPI";
import { DepartmentAPI } from "./datasources/DepartmentAPI";
import { EventAPI } from "./datasources/EventAPI";
import { InMemoryCache } from "./cache/InMemoryCache";
import { createMockApiRouter } from "./mock-apis/router";
import { requestLogger } from "./middleware/logger";
import { apiKeyAuth } from "./middleware/auth";
import { createRateLimiterMiddleware } from "./middleware/rateLimiter";
import { GraphQLContext, AppError } from "./types";
import { GraphQLError, GraphQLFormattedError } from "graphql";

export interface ServerConfig {
  port: number;
  apiBaseUrl?: string;
  rateLimitWindowMs?: number;
  rateLimitMaxRequests?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: 4000,
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 100,
  cacheTtlMs: 30_000,
  cacheMaxEntries: 1000,
};

function formatError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  const originalError = error instanceof GraphQLError ? error.originalError : error;

  if (originalError instanceof AppError) {
    return {
      ...formattedError,
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
        ...originalError.details,
      },
    };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      message: "Internal server error",
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    };
  }

  return formattedError;
}

export async function createServer(config: Partial<ServerConfig> = {}): Promise<{
  app: express.Application;
  server: ApolloServer<GraphQLContext>;
  cache: InMemoryCache;
}> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const apiBaseUrl = mergedConfig.apiBaseUrl ?? `http://localhost:${mergedConfig.port}/api`;

  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(requestLogger);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
    });
  });

  app.use("/api", createMockApiRouter());

  const cache = new InMemoryCache({
    defaultTtlMs: mergedConfig.cacheTtlMs,
    maxEntries: mergedConfig.cacheMaxEntries,
  });

  const dataSources: DataSources = {
    courseAPI: new CourseAPI(apiBaseUrl, cache),
    professorAPI: new ProfessorAPI(apiBaseUrl, cache),
    departmentAPI: new DepartmentAPI(apiBaseUrl, cache),
    eventAPI: new EventAPI(apiBaseUrl, cache),
  };

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError,
    introspection: true,
  });

  await server.start();

  const { middleware: rateLimiterMiddleware } = createRateLimiterMiddleware({
    windowMs: mergedConfig.rateLimitWindowMs,
    maxRequests: mergedConfig.rateLimitMaxRequests,
  });

  app.use(
    "/graphql",
    apiKeyAuth,
    rateLimiterMiddleware,
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const clientId = (req as Request & { clientId?: string }).clientId ?? "anonymous";
        const loaders = createLoaders(dataSources);
        return { dataloaders: loaders, dataSources, clientId };
      },
    }),
  );

  return { app, server, cache };
}
