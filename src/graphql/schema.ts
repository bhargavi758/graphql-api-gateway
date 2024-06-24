export const typeDefs = `#graphql
  enum EventType {
    LECTURE
    SEMINAR
    WORKSHOP
    CONFERENCE
    COLLOQUIUM
  }

  type Course {
    id: ID!
    title: String!
    code: String!
    description: String!
    credits: Int!
    semester: String!
    maxEnrollment: Int!
    currentEnrollment: Int!
    professor: Professor!
    department: Department!
  }

  type Professor {
    id: ID!
    name: String!
    email: String!
    title: String!
    specialization: String!
    officeLocation: String!
    phoneExtension: String!
    department: Department!
    courses: [Course!]!
  }

  type Department {
    id: ID!
    name: String!
    code: String!
    description: String!
    building: String!
    head: Professor
    professors: [Professor!]!
    courses: [Course!]!
    events: [Event!]!
  }

  type Event {
    id: ID!
    title: String!
    description: String!
    date: String!
    endDate: String!
    location: String!
    type: EventType!
    isPublic: Boolean!
    department: Department!
  }

  type CourseConnection {
    data: [Course!]!
    total: Int!
  }

  type ProfessorConnection {
    data: [Professor!]!
    total: Int!
  }

  type DepartmentConnection {
    data: [Department!]!
    total: Int!
  }

  type EventConnection {
    data: [Event!]!
    total: Int!
  }

  type Query {
    course(id: ID!): Course
    courses(
      departmentId: ID
      professorId: ID
      semester: String
      limit: Int
      offset: Int
    ): CourseConnection!

    professor(id: ID!): Professor
    professors(
      departmentId: ID
      limit: Int
      offset: Int
    ): ProfessorConnection!

    department(id: ID!): Department
    departments(
      limit: Int
      offset: Int
    ): DepartmentConnection!

    event(id: ID!): Event
    events(
      departmentId: ID
      type: EventType
      fromDate: String
      toDate: String
      limit: Int
      offset: Int
    ): EventConnection!
  }
`;
