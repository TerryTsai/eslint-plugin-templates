import { describe, expect, it } from "vitest";

import { A, B, C, blocksFor } from "../helpers/fixtures";

describe("layoutConfig — specificity ordering", () => {
  it("more-specific keys appear later (last-wins)", () => {
    const blocks = blocksFor({ content: { "*.ts": A, "index.ts": B } });
    expect(blocks.map((b) => b.files![0])).toEqual(["src/x/*.ts", "src/x/index.ts"]);
  });

  it("ties broken by literal-character count", () => {
    const blocks = blocksFor({ content: { "*.ts": A, "*.test.ts": B, "x.ts": C } });
    const order = blocks.map((b) => b.files![0]);
    const idxAll = order.indexOf("src/x/*.ts");
    const idxTest = order.indexOf("src/x/*.test.ts");
    const idxLiteral = order.indexOf("src/x/x.ts");
    expect(idxAll).toBeLessThan(idxTest);
    expect(idxTest).toBeLessThan(idxLiteral);
  });
});
