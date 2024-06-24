import { GraphQLError } from "graphql";
import { Professor, GraphQLContext } from "../../types";

export const professorResolvers = {
  Query: {
    professor: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const professor = await context.dataloaders.professorLoader.load(args.id);
      if (!professor) {
        throw new GraphQLError("Professor not found", {
          extensions: { code: "NOT_FOUND", id: args.id },
        });
      }
      return professor;
    },

    professors: async (
      _parent: unknown,
      args: {
        departmentId?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext,
    ) => {
      return context.dataSources.professorAPI.getAll({
        departmentId: args.departmentId,
        limit: args.limit,
        offset: args.offset,
      });
    },
  },

  Professor: {
    department: async (parent: Professor, _args: unknown, context: GraphQLContext) => {
      const department = await context.dataloaders.departmentLoader.load(parent.departmentId);
      if (!department) {
        throw new GraphQLError("Associated department not found", {
          extensions: {
            code: "DATA_INTEGRITY_ERROR",
            departmentId: parent.departmentId,
            professorId: parent.id,
          },
        });
      }
      return department;
    },

    courses: async (parent: Professor, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.coursesByProfessorLoader.load(parent.id);
    },
  },
};
