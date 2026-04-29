import { expect, it } from "vitest";

import { defineModule } from "../../src/config/defineModule";
import { A, B, C, blocksFor } from "../_helpers/applyModule";

it("specificity: sorts within a folder so most-specific is emitted last", () => {
  const m = defineModule({ contents: { "*.ts": A, "*.test.ts": B, "index.ts": C } });
  const blocks = blocksFor(m);
  const globs = blocks.map((b) => b.files[0]);
  expect(globs).toEqual(["src/x/*.ts", "src/x/*.test.ts", "src/x/index.ts"]);
});

it("specificity: ignores the order keys were written in", () => {
  const m = defineModule({ contents: { "index.ts": C, "*.ts": A } });
  const blocks = blocksFor(m);
  expect(blocks.map((b) => b.files[0])).toEqual(["src/x/*.ts", "src/x/index.ts"]);
});

it("naming: each match block carries a name with the template id and glob", () => {
  const blocks = blocksFor(defineModule({ contents: { "index.ts": A } }));
  expect(blocks[0]?.name).toBe("templates:a@src/x/index.ts");
});

it("naming: each forbid block carries a name with the closed path", () => {
  const blocks = blocksFor(defineModule({ contents: { "index.ts": A }, closed: true }));
  expect(blocks[blocks.length - 1]?.name).toBe("templates:closed@src/x");
});
