import { z } from "zod";

/** A directed connection between two node ids in a flow graph. */
export const edgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type FlowGraphEdgeDoc = z.infer<typeof edgeSchema>;
