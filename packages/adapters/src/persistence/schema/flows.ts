import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { connectedAccounts } from "./connected-accounts.js";

export const flowStatusEnum = pgEnum("flow_status", ["draft", "active"]);

/**
 * `graph` is typed `unknown`, never `$type<FlowGraph>()` (design D8). That
 * is the mechanism that makes write/read validation structurally
 * unskippable: TypeScript refuses to hand an unvalidated jsonb value to
 * any caller. Only `DrizzleFlowRepository` reads or writes this column.
 */
export const flows = pgTable("flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => connectedAccounts.id),
  name: text("name").notNull(),
  status: flowStatusEnum("status").notNull().default("draft"),
  scope: text("scope").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  graph: jsonb("graph").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
