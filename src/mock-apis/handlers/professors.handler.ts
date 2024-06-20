import { Request, Response } from "express";
import { professors } from "../data/professors";

export function getAllProfessors(req: Request, res: Response): void {
  const { departmentId, limit, offset } = req.query;

  let filtered = professors;

  if (typeof departmentId === "string") {
    filtered = filtered.filter((p) => p.departmentId === departmentId);
  }

  const start = offset ? parseInt(offset as string, 10) : 0;
  const count = limit ? parseInt(limit as string, 10) : filtered.length;

  res.json({
    data: filtered.slice(start, start + count),
    total: filtered.length,
  });
}

export function getProfessorById(req: Request, res: Response): void {
  const professor = professors.find((p) => p.id === req.params.id);
  if (!professor) {
    res.status(404).json({ error: "Professor not found", id: req.params.id });
    return;
  }
  res.json({ data: professor });
}

export function getProfessorsByIds(req: Request, res: Response): void {
  const ids = req.query.ids;
  if (!ids || typeof ids !== "string") {
    res.status(400).json({ error: "ids query parameter required (comma-separated)" });
    return;
  }

  const idList = ids.split(",");
  const found = idList.map((id) => professors.find((p) => p.id === id) ?? null);
  res.json({ data: found });
}
