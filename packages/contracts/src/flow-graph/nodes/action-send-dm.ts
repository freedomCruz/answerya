import { z } from "zod";

import { FLOW_NODE_TYPE } from "../node-types.js";

/** Sends a private reply (DM) to the commenter. */
export const sendDmNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal(FLOW_NODE_TYPE.ACTION_SEND_DM),
  message: z.string().min(1),
});

export type SendDmNode = z.infer<typeof sendDmNodeSchema>;
