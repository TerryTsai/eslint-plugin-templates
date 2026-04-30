import { describe, expect, it } from "vitest";

import { A, blocksFor } from "../helpers/fixtures";

describe("layoutConfig — closed", () => {
  it("emits a forbid block when `closed` is set on the layout", () => {
    const blocks = blocksFor({ content: { "a.ts": A }, closed: {} });
    const forbid = blocks.find((b) => b.rules?.["templates/forbid"]);
    expect(forbid).toBeDefined();
    expect(forbid?.ignores).toEqual(["src/x/a.ts"]);
  });

  it("propagates closed to descendant folders without their own setting", () => {
    const blocks = blocksFor({ content: { "sub/": { content: { "b.ts": A } } }, closed: {} });
    const forbids = blocks.filter((b) => b.rules?.["templates/forbid"]);
    expect(forbids.length).toBeGreaterThanOrEqual(2);
  });

  it("a nested layout with its own `closed` overrides the parent", () => {
    const blocks = blocksFor({
      content: { "sub/": { content: { "b.ts": A }, closed: { message: "inner" } } },
      closed: { message: "outer" },
    });
    const forbids = blocks.filter((b) => b.rules?.["templates/forbid"]);
    const messages = forbids.map((b) => (b.rules?.["templates/forbid"] as [unknown, { message?: string }])[1]?.message);
    expect(messages).toContain("inner");
    expect(messages).toContain("outer");
  });
});
