import { describe, expect, it } from "vitest";

import { matchObject } from "../../src/match/matchObject";

const ctx = new Map();

describe("matchObject", () => {
  it("matches when all listed keys agree", () => {
    const result = matchObject({ type: "Identifier", name: "x" }, { type: "Identifier", name: "x" }, ctx);
    expect(result.ok).toBe(true);
  });

  it("ignores unlisted keys on the actual node", () => {
    const result = matchObject({ type: "Identifier" }, { type: "Identifier", name: "x", loc: {}, range: [0, 1] }, ctx);
    expect(result.ok).toBe(true);
  });

  it("fails on first key mismatch with a path", () => {
    const result = matchObject({ type: "Identifier", name: "x" }, { type: "Identifier", name: "y" }, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.path?.[0]).toBe("name");
  });

  it("fails when actual is not an object", () => {
    // @ts-expect-error - intentionally non-object target to verify the runtime guard
    const r = matchObject({ type: "X" }, "not-object", ctx);
    expect(r.ok).toBe(false);
  });

  it("recurses into sub-NodeMatchers", () => {
    const r = matchObject(
      { type: "Decl", id: { match: { type: "Identifier", name: "x" } } },
      { type: "Decl", id: { type: "Identifier", name: "x" } },
      ctx,
    );
    expect(r.ok).toBe(true);
  });
});
