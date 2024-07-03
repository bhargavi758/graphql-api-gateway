import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface LogEntry {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  clientId?: string;
  userAgent?: string;
  query?: string;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const start = Date.now();

  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      clientId: req.headers["x-client-id"] as string | undefined,
      userAgent: req.headers["user-agent"],
    };

    if (req.body?.query && typeof req.body.query === "string") {
      entry.query = req.body.query.slice(0, 200);
    }

    const output = formatLog(entry);
    if (res.statusCode >= 400) {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  });

  next();
}
