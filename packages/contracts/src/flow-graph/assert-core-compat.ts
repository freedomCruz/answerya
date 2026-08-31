import type { FlowGraph } from "@answerya/core";

import type { FlowGraphV1 } from "./graph.js";

/**
 * Compile-time-only assertion (design D8): the Zod-inferred v1 graph type
 * must stay assignable to core's plain-TS `FlowGraph`. This never runs —
 * if the two types drift, `tsc` fails the build here rather than at some
 * unrelated call site.
 */
type AssertFlowGraphV1AssignableToCore = FlowGraphV1 extends FlowGraph ? true : never;
const _assertFlowGraphV1AssignableToCore: AssertFlowGraphV1AssignableToCore = true;
void _assertFlowGraphV1AssignableToCore;
