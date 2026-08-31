import { NextResponse } from "next/server";

// Liveness endpoint consumed by the `web` service's Compose healthcheck
// (design D9). No dependency on Postgres/Redis is checked here — this is a
// process-liveness probe, not a readiness probe for downstream infra.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
