import { Request, Response } from "express";
import { departments } from "../data/departments";

export function getAllDepartments(req: Request, res: Response): void {
  const { limit, offset } = req.query;

  const start = offset ? parseInt(offset as string, 10) : 0;
  const count = limit ? parseInt(limit as string, 10) : departments.length;

  res.json({
    data: departments.slice(start, start + count),
    total: departments.length,
  });
}

export function getDepartmentById(req: Request, res: Response): void {
  const department = departments.find((d) => d.id === req.params.id);
  if (!department) {
    res.status(404).json({ error: "Department not found", id: req.params.id });
    return;
  }
  res.json({ data: department });
}

export function getDepartmentsByIds(req: Request, res: Response): void {
  const ids = req.query.ids;
  if (!ids || typeof ids !== "string") {
    res.status(400).json({ error: "ids query parameter required (comma-separated)" });
    return;
  }

  const idList = ids.split(",");
  const found = idList.map((id) => departments.find((d) => d.id === id) ?? null);
  res.json({ data: found });
}
