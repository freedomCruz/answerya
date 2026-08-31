import { integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { flows } from "./flows.js";

export const flowExecutionStatusEnum = pgEnum("flow_execution_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

/**
 * `commentId` is UNIQUE ALONE, never composite with `flowId` (design D6,
 * the product's highest-severity invariant). Meta allows exactly ONE
 * private reply per comment, forever — a `(flow_id, comment_id)` index
 * would let two flows each claim the same comment and burn that reply.
 * Idempotency is enforced here, at the database, via
 * `INSERT ... ON CONFLICT (comment_id) DO NOTHING` — never in application
 * logic.
 */
export const flowExecutions = pgTable("flow_executions", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id")
    .notNull()
    .references(() => flows.id),
  commentId: text("comment_id").notNull().unique(),
  status: flowExecutionStatusEnum("status").notNull().default("pending"),
  currentNodeId: text("current_node_id"),
  attempts: integer("attempts").notNull().default(0),
  error: text("error"),
});
