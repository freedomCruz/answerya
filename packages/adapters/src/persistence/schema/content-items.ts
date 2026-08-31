import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { platformEnum } from "./platform.js";
import { connectedAccounts } from "./connected-accounts.js";

/** Unified across platforms — the comparative dashboard depends on it. */
export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: platformEnum("platform").notNull(),
    externalId: text("external_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => connectedAccounts.id),
    type: text("type").notNull(),
    permalink: text("permalink").notNull(),
    caption: text("caption"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("content_items_platform_external_id_key").on(table.platform, table.externalId),
  ],
);
