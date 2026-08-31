// Port: claims a flow execution slot for a comment, backed by the
// `flow_executions.comment_id` UNIQUE index (design D5/D6). Implemented by
// an adapter (ANS-03); this stage declares the contract only.
//
// `ALREADY_CLAIMED` is a SUCCESS value, never an error: `INSERT ...
// ON CONFLICT DO NOTHING` returning zero rows is the one-private-reply
// invariant working as designed. Modelling it as `Err` would invite a
// caller to retry it, which is exactly the bug this port exists to
// prevent.

import type { Result } from "../../shared/result.js";

export interface ExecutionClaim {
  readonly flowId: string;
  readonly commentId: string;
}

export const CLAIM_OUTCOME = {
  CLAIMED: "claimed",
  ALREADY_CLAIMED: "already_claimed",
} as const;

export type ClaimOutcome = (typeof CLAIM_OUTCOME)[keyof typeof CLAIM_OUTCOME];

export const LEDGER_ERROR = {
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type LedgerError = (typeof LEDGER_ERROR)[keyof typeof LEDGER_ERROR];

export interface ExecutionLedger {
  claim(input: ExecutionClaim): Promise<Result<ClaimOutcome, LedgerError>>;
}
