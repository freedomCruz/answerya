import { jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { platformEnum } from "./platform.js";
import { contentItems } from "./content-items.js";

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: platformEnum("platform").notNull(),
    externalId: text("external_id").notNull(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id),
    authorExternalId: text("author_external_id").notNull(),
    text: text("text").notNull(),
    raw: jsonb("raw").$type<unknown>().notNull(),
  },
  (table) => [unique("comments_platform_external_id_key").on(table.platform, table.externalId)],
);
