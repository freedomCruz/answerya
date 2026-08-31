// Shared domain primitive: models success/failure without throwing.
//
// Uses the const-object pattern (RESULT_KIND) instead of a TypeScript
// `enum` per project convention — single source of truth, runtime values,
// and no separate `enum` emit concern under `isolatedModules`.

export const RESULT_KIND = {
  OK: "ok",
  ERR: "err",
} as const;

export type ResultKind = (typeof RESULT_KIND)[keyof typeof RESULT_KIND];

export interface Ok<T> {
  readonly kind: typeof RESULT_KIND.OK;
  readonly value: T;
}

export interface Err<E> {
  readonly kind: typeof RESULT_KIND.ERR;
  readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { kind: RESULT_KIND.OK, value };
}

export function err<E>(error: E): Err<E> {
  return { kind: RESULT_KIND.ERR, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.kind === RESULT_KIND.OK;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.kind === RESULT_KIND.ERR;
}
