// Port: reads platform performance metrics for a content item. Implemented
// by an adapter (later stage); this stage declares the contract only.

import type { Result } from "../../shared/result.js";

export interface MetricSnapshot {
  readonly contentItemId: string;
  readonly capturedAt: Date;
  readonly views: number;
  readonly likes: number;
  readonly comments: number;
  readonly shares: number;
  readonly saves: number;
  readonly reach: number;
}

export const METRIC_SOURCE_ERROR = {
  NOT_FOUND: "not_found",
  UPSTREAM_UNAVAILABLE: "upstream_unavailable",
} as const;

export type MetricSourceError = (typeof METRIC_SOURCE_ERROR)[keyof typeof METRIC_SOURCE_ERROR];

export interface MetricSource {
  fetchLatest(contentItemId: string): Promise<Result<MetricSnapshot, MetricSourceError>>;
}
