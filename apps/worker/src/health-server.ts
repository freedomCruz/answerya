// Liveness server for @answerya/worker.
//
// Deliberately built on `node:http` alone (zero npm dependencies) — this is
// what the worker's Compose healthcheck probes, and design D9 rejects a
// `pgrep`-style process check because it proves a process exists, not that
// it functions. This endpoint is also where ANS-08 metrics will later land.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const HEALTH_PATH = "/health";

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  if (req.method === "GET" && req.url === HEALTH_PATH) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "not_found" }));
}

export function startHealthServer(port: number) {
  const server = createServer(handleRequest);
  server.listen(port);
  return server;
}
