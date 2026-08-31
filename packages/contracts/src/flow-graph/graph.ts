import { z } from "zod";

import { FLOW_NODE_TYPE } from "./node-types.js";
import { triggerCommentNodeSchema } from "./nodes/trigger-comment.js";
import { sendDmNodeSchema } from "./nodes/action-send-dm.js";
import { publicReplyNodeSchema } from "./nodes/action-public-reply.js";
import { edgeSchema } from "./edge.js";

const flowNodeSchema = z.discriminatedUnion("type", [
  triggerCommentNodeSchema,
  sendDmNodeSchema,
  publicReplyNodeSchema,
]);

/**
 * `flows.graph` version 1 (design D8). Refinements enforce the invariants
 * that a discriminated union alone cannot express: unique node ids, edges
 * that only reference existing nodes, and exactly one trigger node.
 */
export const flowGraphV1Schema = z
  .object({
    nodes: z.array(flowNodeSchema).min(1),
    edges: z.array(edgeSchema),
  })
  .refine((graph) => new Set(graph.nodes.map((node) => node.id)).size === graph.nodes.length, {
    message: "Node ids must be unique within a graph",
  })
  .refine(
    (graph) => {
      const nodeIds = new Set(graph.nodes.map((node) => node.id));
      return graph.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));
    },
    { message: "Edges must reference existing node ids" },
  )
  .refine(
    (graph) =>
      graph.nodes.filter((node) => node.type === FLOW_NODE_TYPE.TRIGGER_COMMENT).length === 1,
    { message: "A graph must contain exactly one trigger node" },
  );

export type FlowGraphV1 = z.infer<typeof flowGraphV1Schema>;
