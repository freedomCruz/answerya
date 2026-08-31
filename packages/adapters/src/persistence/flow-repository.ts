// The sole module in `@answerya/adapters/persistence` that touches
// `flows` (task 4.18, design D8). `save()` validates before any SQL
// executes; `findById()` re-validates on the way out. Neither edge can be
// skipped because the Drizzle column is typed `unknown`, not `FlowGraph`
// — see `schema/flows.ts`.
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  err,
  ok,
  type FlowGraph,
  type FlowRepository,
  type FlowRepositoryError,
  type Result,
  FLOW_REPOSITORY_ERROR,
} from "@answerya/core";
import { FLOW_GRAPH_SCHEMAS, type FlowGraphSchemaVersion } from "@answerya/contracts";

import { flows } from "./schema/flows.js";
import type * as schema from "./schema/index.js";

const CURRENT_SCHEMA_VERSION: FlowGraphSchemaVersion = 1;

function isKnownSchemaVersion(version: number): version is FlowGraphSchemaVersion {
  return version in FLOW_GRAPH_SCHEMAS;
}

export class DrizzleFlowRepository implements FlowRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async save(id: string, graph: FlowGraph): Promise<Result<void, FlowRepositoryError>> {
    const validator = FLOW_GRAPH_SCHEMAS[CURRENT_SCHEMA_VERSION];
    const parsed = validator.safeParse(graph);
    if (!parsed.success) {
      return err(FLOW_REPOSITORY_ERROR.INVALID_GRAPH);
    }

    await this.db
      .update(flows)
      .set({ graph: parsed.data, schemaVersion: CURRENT_SCHEMA_VERSION })
      .where(eq(flows.id, id));

    return ok(undefined);
  }

  async findById(id: string): Promise<Result<FlowGraph, FlowRepositoryError>> {
    const [row] = await this.db.select().from(flows).where(eq(flows.id, id)).limit(1);
    if (!row) {
      return err(FLOW_REPOSITORY_ERROR.NOT_FOUND);
    }

    if (!isKnownSchemaVersion(row.schemaVersion)) {
      return err(FLOW_REPOSITORY_ERROR.UNSUPPORTED_VERSION);
    }

    const validator = FLOW_GRAPH_SCHEMAS[row.schemaVersion];
    const parsed = validator.safeParse(row.graph);
    if (!parsed.success) {
      return err(FLOW_REPOSITORY_ERROR.INVALID_GRAPH);
    }

    return ok(parsed.data);
  }
}
