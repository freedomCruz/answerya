// Shared domain primitive: abstracts time access so domain logic never
// calls `Date` directly and stays substitutable in tests.

export interface Clock {
  now(): Date;
}
