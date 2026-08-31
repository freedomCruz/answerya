import { integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { connectedAccounts } from "./connected-accounts.js";

export const accountSnapshots = pgTable(
  "account_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => connectedAccounts.id),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    followers: integer("followers").notNull(),
    following: integer("following").notNull(),
    totalViews: integer("total_views").notNull(),
  },
  (table) => [
    unique("account_snapshots_account_id_captured_at_key").on(table.accountId, table.capturedAt),
  ],
);
