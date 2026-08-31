import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * `raw` is NOT NULL and written before any parsing (design D6/ANS-00
 * §4.4): the raw payload must survive even a parsing bug, so it can be
 * reprocessed later. `dedupeKey` UNIQUE prevents duplicate processing of
 * the same webhook delivery.
 */
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  raw: jsonb("raw").$type<unknown>().notNull(),
  dedupeKey: text("dedupe_key").notNull().unique(),
  signatureOk: boolean("signature_ok").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
