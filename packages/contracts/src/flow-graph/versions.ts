import { flowGraphV1Schema } from "./graph.js";

/**
 * `schema_version` → validator registry (design D8). Adding a version is
 * one new entry here; it never requires an `ALTER TABLE` on `flows`.
 */
export const FLOW_GRAPH_SCHEMAS = {
  1: flowGraphV1Schema,
} as const;

export type FlowGraphSchemaVersion = keyof typeof FLOW_GRAPH_SCHEMAS;
