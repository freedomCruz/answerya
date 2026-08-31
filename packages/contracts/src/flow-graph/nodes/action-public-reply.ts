import { z } from "zod";

import { FLOW_NODE_TYPE } from "../node-types.js";

/** Posts a public reply to the triggering comment. */
export const publicReplyNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal(FLOW_NODE_TYPE.ACTION_PUBLIC_REPLY),
  message: z.string().min(1),
});

export type PublicReplyNode = z.infer<typeof publicReplyNodeSchema>;
