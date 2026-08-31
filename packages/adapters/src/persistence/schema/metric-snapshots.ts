import { integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { contentItems } from "./content-items.js";

export const metricSnapshots = pgTable(
  "metric_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    views: integer("views").notNull(),
    likes: integer("likes").notNull(),
    comments: integer("comments").notNull(),
    shares: integer("shares").notNull(),
    saves: integer("saves").notNull(),
    reach: integer("reach").notNull(),
  },
  (table) => [
    unique("metric_snapshots_content_item_id_captured_at_key").on(
      table.contentItemId,
      table.capturedAt,
    ),
  ],
);
