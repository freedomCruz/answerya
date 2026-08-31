// Port: read access to platform comments. Implemented by an adapter
// (ANS-02); this stage declares the contract only.

import type { Result } from "../../shared/result.js";

export const PLATFORM = {
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
} as const;

export type Platform = (typeof PLATFORM)[keyof typeof PLATFORM];

export interface Comment {
  readonly platform: Platform;
  readonly externalId: string;
  readonly contentItemId: string;
  readonly authorExternalId: string;
  readonly text: string;
}

export const COMMENT_SOURCE_ERROR = {
  NOT_FOUND: "not_found",
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type CommentSourceError = (typeof COMMENT_SOURCE_ERROR)[keyof typeof COMMENT_SOURCE_ERROR];

export interface CommentSource {
  findByExternalId(
    platform: Platform,
    externalId: string,
  ): Promise<Result<Comment, CommentSourceError>>;
}
