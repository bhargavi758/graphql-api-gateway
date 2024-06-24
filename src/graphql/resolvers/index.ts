import { courseResolvers } from "./course.resolver";
import { professorResolvers } from "./professor.resolver";
import { departmentResolvers } from "./department.resolver";
import { eventResolvers } from "./event.resolver";

function mergeResolvers(...resolverSets: Record<string, Record<string, unknown>>[]): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {};

  for (const resolvers of resolverSets) {
    for (const [typeName, fieldResolvers] of Object.entries(resolvers)) {
      if (!merged[typeName]) {
        merged[typeName] = {};
      }
      Object.assign(merged[typeName], fieldResolvers);
    }
  }

  return merged;
}

export const resolvers = mergeResolvers(
  courseResolvers,
  professorResolvers,
  departmentResolvers,
  eventResolvers,
);
