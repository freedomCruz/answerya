// Port: sends a private (DM) reply to a comment author. Implemented by an
// adapter (ANS-02); this stage declares the contract only.

import type { Result } from "../../shared/result.js";
import type { Platform } from "./comment-source.js";

export interface PrivateReplyRequest {
  readonly platform: Platform;
  readonly recipientExternalId: string;
  readonly commentExternalId: string;
  readonly text: string;
}

export const PRIVATE_REPLY_ERROR = {
  RECIPIENT_UNREACHABLE: "recipient_unreachable",
  RATE_LIMITED: "rate_limited",
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type PrivateReplyError = (typeof PRIVATE_REPLY_ERROR)[keyof typeof PRIVATE_REPLY_ERROR];

export interface PrivateReplySender {
  send(request: PrivateReplyRequest): Promise<Result<void, PrivateReplyError>>;
}
