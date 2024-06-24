import DataLoader from "dataloader";
import { Course, Professor, Department, AcademicEvent, DataLoaders } from "../../types";
import { CourseAPI } from "../../datasources/CourseAPI";
import { ProfessorAPI } from "../../datasources/ProfessorAPI";
import { DepartmentAPI } from "../../datasources/DepartmentAPI";
import { EventAPI } from "../../datasources/EventAPI";

export interface DataSources {
  courseAPI: CourseAPI;
  professorAPI: ProfessorAPI;
  departmentAPI: DepartmentAPI;
  eventAPI: EventAPI;
}

export function createLoaders(dataSources: DataSources): DataLoaders {
  const courseLoader = new DataLoader<string, Course | null>(
    async (ids) => dataSources.courseAPI.getByIds(ids as string[]),
    { maxBatchSize: 50 },
  );

  const professorLoader = new DataLoader<string, Professor | null>(
    async (ids) => dataSources.professorAPI.getByIds(ids as string[]),
    { maxBatchSize: 50 },
  );

  const departmentLoader = new DataLoader<string, Department | null>(
    async (ids) => dataSources.departmentAPI.getByIds(ids as string[]),
    { maxBatchSize: 50 },
  );

  const eventLoader = new DataLoader<string, AcademicEvent | null>(
    async (ids) => dataSources.eventAPI.getByIds(ids as string[]),
    { maxBatchSize: 50 },
  );

  const coursesByDepartmentLoader = new DataLoader<string, Course[]>(
    async (departmentIds) => {
      const results = await Promise.all(
        (departmentIds as string[]).map((id) => dataSources.courseAPI.getByDepartment(id)),
      );
      return results;
    },
    { maxBatchSize: 20 },
  );

  const coursesByProfessorLoader = new DataLoader<string, Course[]>(
    async (professorIds) => {
      const results = await Promise.all(
        (professorIds as string[]).map((id) => dataSources.courseAPI.getByProfessor(id)),
      );
      return results;
    },
    { maxBatchSize: 20 },
  );

  const professorsByDepartmentLoader = new DataLoader<string, Professor[]>(
    async (departmentIds) => {
      const results = await Promise.all(
        (departmentIds as string[]).map((id) => dataSources.professorAPI.getByDepartment(id)),
      );
      return results;
    },
    { maxBatchSize: 20 },
  );

  const eventsByDepartmentLoader = new DataLoader<string, AcademicEvent[]>(
    async (departmentIds) => {
      const results = await Promise.all(
        (departmentIds as string[]).map((id) => dataSources.eventAPI.getByDepartment(id)),
      );
      return results;
    },
    { maxBatchSize: 20 },
  );

  return {
    courseLoader,
    professorLoader,
    departmentLoader,
    eventLoader,
    coursesByDepartmentLoader,
    coursesByProfessorLoader,
    professorsByDepartmentLoader,
    eventsByDepartmentLoader,
  };
}
