import { describe, expect, it } from "vitest";

import { matchList } from "../../src/match/matchList";
import { type NodeMatcher } from "../../src/match/types";

const ctx = new Map();
const a: NodeMatcher = { match: { type: "A" } };
const b: NodeMatcher = { match: { type: "B" } };

describe("matchList", () => {
  it("greedy: each matcher consumes up to max", () => {
    const matchers = [{ ...a, min: 0, max: 3 }, b];
    const r = matchList(matchers, [{ type: "A" }, { type: "A" }, { type: "B" }], ctx);
    expect(r.ok).toBe(true);
  });

  it("under-shoots min: fails", () => {
    const matchers = [{ ...a, min: 2, max: 3 }];
    const r = matchList(matchers, [{ type: "A" }], ctx);
    expect(r.ok).toBe(false);
  });

  it("trailing items after matchers exhausted fails", () => {
    const r = matchList([a], [{ type: "A" }, { type: "B" }], ctx);
    expect(r.ok).toBe(false);
  });

  it("zero-or-more matcher consumes nothing if pattern doesn't fit", () => {
    const matchers = [{ ...a, min: 0, max: 3 }, b];
    const r = matchList(matchers, [{ type: "B" }], ctx);
    expect(r.ok).toBe(true);
  });

  it("non-array actual fails", () => {
    // @ts-expect-error - intentionally non-array target to verify the runtime guard
    const r = matchList([a], "x", ctx);
    expect(r.ok).toBe(false);
  });
});
