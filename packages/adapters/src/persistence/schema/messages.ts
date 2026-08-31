import { jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { conversations } from "./conversations.js";

export const messageDirectionEnum = pgEnum("message_direction", ["inbound", "outbound"]);

/** Minimal provisional shape — see `conversations.ts` for the rationale. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    externalId: text("external_id").notNull(),
    direction: messageDirectionEnum("direction").notNull(),
    text: text("text").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    raw: jsonb("raw").$type<unknown>().notNull(),
  },
  (table) => [
    unique("messages_conversation_id_external_id_key").on(table.conversationId, table.externalId),
  ],
);
