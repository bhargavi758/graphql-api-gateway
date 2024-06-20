import { Router } from "express";
import { getAllCourses, getCourseById, getCoursesByIds } from "./handlers/courses.handler";
import { getAllProfessors, getProfessorById, getProfessorsByIds } from "./handlers/professors.handler";
import { getAllDepartments, getDepartmentById, getDepartmentsByIds } from "./handlers/departments.handler";
import { getAllEvents, getEventById, getEventsByIds } from "./handlers/events.handler";

export function createMockApiRouter(): Router {
  const router = Router();

  router.get("/courses/batch", getCoursesByIds);
  router.get("/courses/:id", getCourseById);
  router.get("/courses", getAllCourses);

  router.get("/professors/batch", getProfessorsByIds);
  router.get("/professors/:id", getProfessorById);
  router.get("/professors", getAllProfessors);

  router.get("/departments/batch", getDepartmentsByIds);
  router.get("/departments/:id", getDepartmentById);
  router.get("/departments", getAllDepartments);

  router.get("/events/batch", getEventsByIds);
  router.get("/events/:id", getEventById);
  router.get("/events", getAllEvents);

  return router;
}
