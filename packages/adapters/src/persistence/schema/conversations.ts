import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { platformEnum } from "./platform.js";
import { connectedAccounts } from "./connected-accounts.js";

/**
 * Deliberately minimal provisional shape (design D6, ANS-00 §4.4 open
 * question): the spec only says "inbox threads". The real shape lands
 * with ANS-02's actual Meta message payloads — do not over-design here.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => connectedAccounts.id),
    platform: platformEnum("platform").notNull(),
    externalThreadId: text("external_thread_id").notNull(),
    participantExternalId: text("participant_external_id").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  },
  (table) => [
    unique("conversations_platform_external_thread_id_key").on(
      table.platform,
      table.externalThreadId,
    ),
  ],
);
