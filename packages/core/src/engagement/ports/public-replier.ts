// Port: posts a public reply on a comment thread. Implemented by an
// adapter (ANS-02); this stage declares the contract only.

import type { Result } from "../../shared/result.js";
import type { Platform } from "./comment-source.js";

export interface PublicReplyRequest {
  readonly platform: Platform;
  readonly commentExternalId: string;
  readonly text: string;
}

export const PUBLIC_REPLY_ERROR = {
  COMMENT_UNAVAILABLE: "comment_unavailable",
  RATE_LIMITED: "rate_limited",
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type PublicReplyError = (typeof PUBLIC_REPLY_ERROR)[keyof typeof PUBLIC_REPLY_ERROR];

export interface PublicReplier {
  reply(request: PublicReplyRequest): Promise<Result<void, PublicReplyError>>;
}
