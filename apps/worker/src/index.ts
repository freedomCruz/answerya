import { parseEnv } from "@answerya/contracts";
import { startHealthServer } from "./health-server.js";

const env = parseEnv();

startHealthServer(env.WORKER_HEALTH_PORT);

console.log(`worker liveness server listening on :${env.WORKER_HEALTH_PORT}`);
