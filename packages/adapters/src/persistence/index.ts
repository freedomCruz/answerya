// `./persistence` subpath entry point. `DrizzleFlowRepository` is the sole
// export that touches `flows` (design D8, task 4.18) — nothing else here
// reaches that table.
export { DrizzleFlowRepository } from "./flow-repository.js";
