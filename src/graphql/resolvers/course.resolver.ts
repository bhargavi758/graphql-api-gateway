import { GraphQLError } from "graphql";
import { Course, GraphQLContext } from "../../types";

export const courseResolvers = {
  Query: {
    course: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const course = await context.dataloaders.courseLoader.load(args.id);
      if (!course) {
        throw new GraphQLError("Course not found", {
          extensions: { code: "NOT_FOUND", id: args.id },
        });
      }
      return course;
    },

    courses: async (
      _parent: unknown,
      args: {
        departmentId?: string;
        professorId?: string;
        semester?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext,
    ) => {
      return context.dataSources.courseAPI.getAll({
        departmentId: args.departmentId,
        professorId: args.professorId,
        semester: args.semester,
        limit: args.limit,
        offset: args.offset,
      });
    },
  },

  Course: {
    professor: async (parent: Course, _args: unknown, context: GraphQLContext) => {
      const professor = await context.dataloaders.professorLoader.load(parent.professorId);
      if (!professor) {
        throw new GraphQLError("Associated professor not found", {
          extensions: {
            code: "DATA_INTEGRITY_ERROR",
            professorId: parent.professorId,
            courseId: parent.id,
          },
        });
      }
      return professor;
    },

    department: async (parent: Course, _args: unknown, context: GraphQLContext) => {
      const department = await context.dataloaders.departmentLoader.load(parent.departmentId);
      if (!department) {
        throw new GraphQLError("Associated department not found", {
          extensions: {
            code: "DATA_INTEGRITY_ERROR",
            departmentId: parent.departmentId,
            courseId: parent.id,
          },
        });
      }
      return department;
    },
  },
};
