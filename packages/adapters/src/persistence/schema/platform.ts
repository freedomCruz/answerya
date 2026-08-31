import { pgEnum } from "drizzle-orm/pg-core";

/**
 * All four platforms the product targets (design D6). YouTube/TikTok cost
 * nothing to declare now and save an ALTER-TYPE migration in ANS-06.
 */
export const platformEnum = pgEnum("platform", ["instagram", "facebook", "youtube", "tiktok"]);
