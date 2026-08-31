// Tasks 4.23–4.24: DrizzleFlowRepository validates on both write and read
// (design D8). No graph traversal, no engine — this repository's only job
// is validating the document at each edge.
import { beforeEach, describe, expect, it } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { isErr, isOk, FLOW_REPOSITORY_ERROR, type FlowGraph } from "@answerya/core";

import { connectTestDb, truncateAll } from "./db.js";
import * as schema from "../../src/persistence/schema/index.js";
import { connectedAccounts } from "../../src/persistence/schema/connected-accounts.js";
import { flows } from "../../src/persistence/schema/flows.js";
import { DrizzleFlowRepository } from "../../src/persistence/flow-repository.js";

// Node-specific fields (e.g. `message` on `action.send_dm`) are outside
// core's minimal `FlowGraphNode` shape by design (D8: core stays generic
// over node payloads) but required by the contracts Zod schema, so this
// fixture is asserted as `FlowGraph` rather than structurally inferred.
const VALID_GRAPH = {
  nodes: [
    { id: "trigger-1", type: "trigger.comment" },
    { id: "action-1", type: "action.send_dm", message: "Thanks for your comment!" },
  ],
  edges: [{ from: "trigger-1", to: "action-1" }],
} as unknown as FlowGraph;

describe("DrizzleFlowRepository", () => {
  let db: NodePgDatabase<typeof schema>;
  let pool: Pool;
  let repository: DrizzleFlowRepository;
  let flowId: string;

  beforeEach(async () => {
    ({ db, pool } = connectTestDb());
    await truncateAll(db);
    repository = new DrizzleFlowRepository(db);

    const [account] = await db
      .insert(connectedAccounts)
      .values({
        platform: "instagram",
        externalId: "acct-1",
        handle: "@answerya",
        tokenCiphertext: "v1.iv.tag.ct",
        tokenExpiresAt: new Date(),
        scopes: ["comments"],
      })
      .returning();
    const [flow] = await db
      .insert(flows)
      .values({
        accountId: account!.id,
        name: "welcome-dm",
        scope: "account",
        schemaVersion: 1,
        graph: VALID_GRAPH,
      })
      .returning();
    flowId = flow!.id;
  });

  it("rejects a write with an unknown node type before reaching the database", async () => {
    const invalidGraph = {
      nodes: [{ id: "n1", type: "action.unknown" }],
      edges: [],
    } as unknown as FlowGraph;

    const result = await repository.save(flowId, invalidGraph);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe(FLOW_REPOSITORY_ERROR.INVALID_GRAPH);
    }

    const [row] = await db.select().from(flows);
    expect(row?.graph).toEqual(VALID_GRAPH);
  });

  it("re-validates a stored graph against its schema_version on read", async () => {
    const result = await repository.findById(flowId);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual(VALID_GRAPH);
    }

    await pool.end();
  });
});
