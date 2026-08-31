import { check, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { platformEnum } from "./platform.js";

/**
 * `token_ciphertext` stores the self-describing envelope
 * `v1.<iv>.<tag>.<ct>` (design D6/D8). The CHECK constraint makes
 * committing plaintext structurally impossible. ANS-01 ships the column
 * and the constraint only — no crypto implementation, no credential.
 */
export const connectedAccounts = pgTable(
  "connected_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: platformEnum("platform").notNull(),
    externalId: text("external_id").notNull(),
    handle: text("handle").notNull(),
    tokenCiphertext: text("token_ciphertext").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
    scopes: jsonb("scopes").$type<readonly string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("connected_accounts_platform_external_id_key").on(table.platform, table.externalId),
    check(
      "connected_accounts_token_ciphertext_envelope_check",
      sql`${table.tokenCiphertext} ~ '^v[0-9]+\.'`,
    ),
  ],
);
