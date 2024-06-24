import { GraphQLError } from "graphql";
import { Department, GraphQLContext } from "../../types";

export const departmentResolvers = {
  Query: {
    department: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const department = await context.dataloaders.departmentLoader.load(args.id);
      if (!department) {
        throw new GraphQLError("Department not found", {
          extensions: { code: "NOT_FOUND", id: args.id },
        });
      }
      return department;
    },

    departments: async (
      _parent: unknown,
      args: {
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext,
    ) => {
      return context.dataSources.departmentAPI.getAll({
        limit: args.limit,
        offset: args.offset,
      });
    },
  },

  Department: {
    head: async (parent: Department, _args: unknown, context: GraphQLContext) => {
      if (!parent.headOfDepartmentId) return null;
      return context.dataloaders.professorLoader.load(parent.headOfDepartmentId);
    },

    professors: async (parent: Department, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.professorsByDepartmentLoader.load(parent.id);
    },

    courses: async (parent: Department, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.coursesByDepartmentLoader.load(parent.id);
    },

    events: async (parent: Department, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.eventsByDepartmentLoader.load(parent.id);
    },
  },
};
