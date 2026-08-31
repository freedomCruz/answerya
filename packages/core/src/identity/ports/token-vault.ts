// Port: stores and retrieves platform access tokens. Implemented by an
// adapter (ANS-02) backed by `connected_accounts.token_ciphertext` (design
// D6) — no crypto implementation ships in this stage, contract only.

import type { Result } from "../../shared/result.js";

export interface StoredToken {
  readonly accountId: string;
  readonly ciphertext: string;
  readonly expiresAt: Date;
}

export const TOKEN_VAULT_ERROR = {
  NOT_FOUND: "not_found",
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type TokenVaultError = (typeof TOKEN_VAULT_ERROR)[keyof typeof TOKEN_VAULT_ERROR];

export interface TokenVault {
  get(accountId: string): Promise<Result<StoredToken, TokenVaultError>>;
  put(token: StoredToken): Promise<Result<void, TokenVaultError>>;
}
