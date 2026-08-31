// Port: persists and retrieves flow graph documents. Implemented by
// `DrizzleFlowRepository` (ANS-01 PR#4, design D8) — the one place this
// stage ships executable logic, because it is an adapter, not a use case.
//
// `FlowGraph` is declared here as plain TypeScript (no Zod — D4 core
// purity forbids importing `zod`). `packages/contracts` carries a
// compile-time assertion that its Zod-inferred type is assignable to this
// one, so the two cannot drift silently.

import type { Result } from "../../shared/result.js";

export interface FlowGraphNode {
  readonly id: string;
  readonly type: string;
}

export interface FlowGraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface FlowGraph {
  readonly nodes: readonly FlowGraphNode[];
  readonly edges: readonly FlowGraphEdge[];
}

export const FLOW_REPOSITORY_ERROR = {
  NOT_FOUND: "not_found",
  UNSUPPORTED_VERSION: "unsupported_version",
  INVALID_GRAPH: "invalid_graph",
} as const;

export type FlowRepositoryError =
  (typeof FLOW_REPOSITORY_ERROR)[keyof typeof FLOW_REPOSITORY_ERROR];

export interface FlowRepository {
  findById(id: string): Promise<Result<FlowGraph, FlowRepositoryError>>;
  save(id: string, graph: FlowGraph): Promise<Result<void, FlowRepositoryError>>;
}
