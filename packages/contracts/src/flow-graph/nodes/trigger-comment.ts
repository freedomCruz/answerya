import { z } from "zod";

import { FLOW_NODE_TYPE } from "../node-types.js";

/**
 * Fires when a new comment matching an optional keyword filter arrives.
 * Every graph MUST contain exactly one node of this type (enforced by a
 * graph-level refinement in `graph.ts`, not here).
 */
export const triggerCommentNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal(FLOW_NODE_TYPE.TRIGGER_COMMENT),
  keywordFilter: z.array(z.string().min(1)).optional(),
});

export type TriggerCommentNode = z.infer<typeof triggerCommentNodeSchema>;
