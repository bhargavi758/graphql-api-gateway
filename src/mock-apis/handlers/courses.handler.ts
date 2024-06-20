import { Request, Response } from "express";
import { courses } from "../data/courses";

export function getAllCourses(req: Request, res: Response): void {
  const { departmentId, professorId, semester, limit, offset } = req.query;

  let filtered = courses;

  if (typeof departmentId === "string") {
    filtered = filtered.filter((c) => c.departmentId === departmentId);
  }
  if (typeof professorId === "string") {
    filtered = filtered.filter((c) => c.professorId === professorId);
  }
  if (typeof semester === "string") {
    filtered = filtered.filter((c) => c.semester === semester);
  }

  const start = offset ? parseInt(offset as string, 10) : 0;
  const count = limit ? parseInt(limit as string, 10) : filtered.length;

  res.json({
    data: filtered.slice(start, start + count),
    total: filtered.length,
  });
}

export function getCourseById(req: Request, res: Response): void {
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) {
    res.status(404).json({ error: "Course not found", id: req.params.id });
    return;
  }
  res.json({ data: course });
}

export function getCoursesByIds(req: Request, res: Response): void {
  const ids = req.query.ids;
  if (!ids || typeof ids !== "string") {
    res.status(400).json({ error: "ids query parameter required (comma-separated)" });
    return;
  }

  const idList = ids.split(",");
  const found = idList.map((id) => courses.find((c) => c.id === id) ?? null);
  res.json({ data: found });
}
