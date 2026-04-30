import { describe, expect, it } from "vitest";

import { A, B, blocksFor } from "../helpers/fixtures";

describe("layoutConfig — basic", () => {
  it("emits one matchConfig per file", () => {
    const blocks = blocksFor({ content: { "a.ts": A, "b.ts": B } });
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.files).toEqual(["src/x/a.ts"]);
    expect(blocks[0]!.rules?.["templates/match"]).toBeDefined();
  });

  it("recurses into nested folder maps", () => {
    const blocks = blocksFor({ content: { "a.ts": A, "sub/": { content: { "b.ts": B } } } });
    expect(blocks.map((b) => b.files![0])).toEqual(["src/x/a.ts", "src/x/sub/b.ts"]);
  });

  it("passes through severity onto every block's rule", () => {
    const blocks = blocksFor({ content: { "a.ts": A } });
    const rule = blocks[0]!.rules?.["templates/match"] as [string, unknown];
    expect(rule[0]).toBe("error");
  });
});
