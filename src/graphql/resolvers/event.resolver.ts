import { GraphQLError } from "graphql";
import { AcademicEvent, EventType, GraphQLContext } from "../../types";

const EVENT_TYPE_MAP: Record<string, EventType> = {
  LECTURE: "lecture",
  SEMINAR: "seminar",
  WORKSHOP: "workshop",
  CONFERENCE: "conference",
  COLLOQUIUM: "colloquium",
};

const REVERSE_EVENT_TYPE_MAP: Record<EventType, string> = {
  lecture: "LECTURE",
  seminar: "SEMINAR",
  workshop: "WORKSHOP",
  conference: "CONFERENCE",
  colloquium: "COLLOQUIUM",
};

export const eventResolvers = {
  Query: {
    event: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const event = await context.dataloaders.eventLoader.load(args.id);
      if (!event) {
        throw new GraphQLError("Event not found", {
          extensions: { code: "NOT_FOUND", id: args.id },
        });
      }
      return event;
    },

    events: async (
      _parent: unknown,
      args: {
        departmentId?: string;
        type?: string;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
      },
      context: GraphQLContext,
    ) => {
      return context.dataSources.eventAPI.getAll({
        departmentId: args.departmentId,
        type: args.type ? EVENT_TYPE_MAP[args.type] : undefined,
        fromDate: args.fromDate,
        toDate: args.toDate,
        limit: args.limit,
        offset: args.offset,
      });
    },
  },

  Event: {
    type: (parent: AcademicEvent) => {
      return REVERSE_EVENT_TYPE_MAP[parent.type] ?? parent.type.toUpperCase();
    },

    department: async (parent: AcademicEvent, _args: unknown, context: GraphQLContext) => {
      const department = await context.dataloaders.departmentLoader.load(parent.departmentId);
      if (!department) {
        throw new GraphQLError("Associated department not found", {
          extensions: {
            code: "DATA_INTEGRITY_ERROR",
            departmentId: parent.departmentId,
            eventId: parent.id,
          },
        });
      }
      return department;
    },
  },
};
