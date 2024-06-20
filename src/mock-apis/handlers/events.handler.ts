import { Request, Response } from "express";
import { events } from "../data/events";

export function getAllEvents(req: Request, res: Response): void {
  const { departmentId, type, fromDate, toDate, limit, offset } = req.query;

  let filtered = events;

  if (typeof departmentId === "string") {
    filtered = filtered.filter((e) => e.departmentId === departmentId);
  }
  if (typeof type === "string") {
    filtered = filtered.filter((e) => e.type === type);
  }
  if (typeof fromDate === "string") {
    filtered = filtered.filter((e) => e.date >= fromDate);
  }
  if (typeof toDate === "string") {
    filtered = filtered.filter((e) => e.date <= toDate);
  }

  const start = offset ? parseInt(offset as string, 10) : 0;
  const count = limit ? parseInt(limit as string, 10) : filtered.length;

  res.json({
    data: filtered.slice(start, start + count),
    total: filtered.length,
  });
}

export function getEventById(req: Request, res: Response): void {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found", id: req.params.id });
    return;
  }
  res.json({ data: event });
}

export function getEventsByIds(req: Request, res: Response): void {
  const ids = req.query.ids;
  if (!ids || typeof ids !== "string") {
    res.status(400).json({ error: "ids query parameter required (comma-separated)" });
    return;
  }

  const idList = ids.split(",");
  const found = idList.map((id) => events.find((e) => e.id === id) ?? null);
  res.json({ data: found });
}
