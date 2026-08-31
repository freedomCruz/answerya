// Flow graph node type registry (design D8).
//
// Each entry corresponds to one per-node-type Zod schema in `./nodes/`.
// Adding a node type is one new entry here plus one new schema file — no
// `ALTER TABLE` migration, because `flows.graph` is an owned jsonb document.

export const FLOW_NODE_TYPE = {
  TRIGGER_COMMENT: "trigger.comment",
  ACTION_SEND_DM: "action.send_dm",
  ACTION_PUBLIC_REPLY: "action.public_reply",
} as const;

export type FlowNodeType = (typeof FLOW_NODE_TYPE)[keyof typeof FLOW_NODE_TYPE];
