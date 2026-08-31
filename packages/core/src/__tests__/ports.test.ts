// Type-level compilation test for the seven declared ports. These are
// interfaces with no implementation (spec `domain-core`, "Port
// Declarations Without Implementation"); this file proves each one is
// expressible and typecheckable with a minimal in-memory fake, entirely
// without any adapter or database import. Assigning each fake to its port
// type is itself the type-level proof — `tsc`/`vitest run` would fail to
// compile this file if any port's shape were wrong; the runtime
// assertions on top just keep every case from being erased as dead code.

import { describe, expect, it } from "vitest";

import type { CommentSource } from "../engagement/ports/comment-source.js";
import type { PrivateReplySender } from "../engagement/ports/private-reply-sender.js";
import type { PublicReplier } from "../engagement/ports/public-replier.js";
import { CLAIM_OUTCOME, type ExecutionLedger } from "../engagement/ports/execution-ledger.js";
import type { FlowRepository } from "../engagement/ports/flow-repository.js";
import type { MetricSource } from "../analytics/ports/metric-source.js";
import type { TokenVault } from "../identity/ports/token-vault.js";
import { ok } from "../shared/result.js";

describe("ports type-level compilation", () => {
  it("CommentSource is expressible without an adapter import", () => {
    const fake: CommentSource = {
      findByExternalId: async () =>
        ok({
          platform: "instagram",
          externalId: "c1",
          contentItemId: "ci1",
          authorExternalId: "a1",
          text: "hello",
        }),
    };

    expect(typeof fake.findByExternalId).toBe("function");
  });

  it("PrivateReplySender is expressible without an adapter import", () => {
    const fake: PrivateReplySender = {
      send: async () => ok(undefined),
    };

    expect(typeof fake.send).toBe("function");
  });

  it("PublicReplier is expressible without an adapter import", () => {
    const fake: PublicReplier = {
      reply: async () => ok(undefined),
    };

    expect(typeof fake.reply).toBe("function");
  });

  it("ExecutionLedger.claim() types ALREADY_CLAIMED as a success value", () => {
    const fake: ExecutionLedger = {
      claim: async () => ok(CLAIM_OUTCOME.ALREADY_CLAIMED),
    };

    expect(typeof fake.claim).toBe("function");
  });

  it("FlowRepository is expressible without an adapter import", () => {
    const fake: FlowRepository = {
      findById: async () => ok({ nodes: [], edges: [] }),
      save: async () => ok(undefined),
    };

    expect(typeof fake.findById).toBe("function");
    expect(typeof fake.save).toBe("function");
  });

  it("MetricSource is expressible without an adapter import", () => {
    const fake: MetricSource = {
      fetchLatest: async () =>
        ok({
          contentItemId: "ci1",
          capturedAt: new Date(),
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          reach: 0,
        }),
    };

    expect(typeof fake.fetchLatest).toBe("function");
  });

  it("TokenVault is expressible without an adapter import", () => {
    const fake: TokenVault = {
      get: async () => ok({ accountId: "a1", ciphertext: "v1.iv.tag.ct", expiresAt: new Date() }),
      put: async () => ok(undefined),
    };

    expect(typeof fake.get).toBe("function");
    expect(typeof fake.put).toBe("function");
  });
});
