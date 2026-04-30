import { describe, expect, it } from "vitest";

import { matchNode } from "../../src/match/matchNode";

const ctx = new Map();

describe("matchNode", () => {
  it("dispatches to the object form of match", () => {
    const m = { match: { type: "Identifier", name: "x" } };
    expect(matchNode(m, { type: "Identifier", name: "x" }, ctx).ok).toBe(true);
  });

  it("includes the matcher name in the failure path", () => {
    const m = { name: "MY_NODE", match: { type: "X" } };
    const r = matchNode(m, { type: "Y" }, ctx);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.path?.[0]).toBe("@MY_NODE");
  });
});
