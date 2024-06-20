import DataLoader from "dataloader";

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  credits: number;
  professorId: string;
  departmentId: string;
  semester: string;
  maxEnrollment: number;
  currentEnrollment: number;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  title: string;
  departmentId: string;
  specialization: string;
  officeLocation: string;
  phoneExtension: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  building: string;
  headOfDepartmentId: string;
}

export interface AcademicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  location: string;
  departmentId: string;
  type: EventType;
  isPublic: boolean;
}

export type EventType = "lecture" | "seminar" | "workshop" | "conference" | "colloquium";

export interface PaginationArgs {
  limit?: number;
  offset?: number;
}

export interface CourseFilterArgs extends PaginationArgs {
  departmentId?: string;
  professorId?: string;
  semester?: string;
}

export interface ProfessorFilterArgs extends PaginationArgs {
  departmentId?: string;
}

export interface EventFilterArgs extends PaginationArgs {
  departmentId?: string;
  type?: EventType;
  fromDate?: string;
  toDate?: string;
}

export interface GraphQLContext {
  dataloaders: DataLoaders;
  dataSources: {
    courseAPI: import("../datasources/CourseAPI").CourseAPI;
    professorAPI: import("../datasources/ProfessorAPI").ProfessorAPI;
    departmentAPI: import("../datasources/DepartmentAPI").DepartmentAPI;
    eventAPI: import("../datasources/EventAPI").EventAPI;
  };
  clientId: string;
}

export interface DataLoaders {
  courseLoader: DataLoader<string, Course | null>;
  professorLoader: DataLoader<string, Professor | null>;
  departmentLoader: DataLoader<string, Department | null>;
  eventLoader: DataLoader<string, AcademicEvent | null>;
  coursesByDepartmentLoader: DataLoader<string, Course[]>;
  coursesByProfessorLoader: DataLoader<string, Course[]>;
  professorsByDepartmentLoader: DataLoader<string, Professor[]>;
  eventsByDepartmentLoader: DataLoader<string, AcademicEvent[]>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, "NOT_FOUND", 404);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterMs: number) {
    super("Rate limit exceeded", "RATE_LIMITED", 429, {
      retryAfterMs,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Invalid or missing API key") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export class DataSourceError extends AppError {
  constructor(source: string, originalError?: Error) {
    super(
      `Failed to fetch data from ${source}`,
      "DATA_SOURCE_ERROR",
      502,
      { source, originalMessage: originalError?.message },
    );
  }
}
