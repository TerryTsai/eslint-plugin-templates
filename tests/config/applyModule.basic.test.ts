import { expect, it } from "vitest";

import { applyModule } from "../../src/config/applyModule";
import { defineModule } from "../../src/config/defineModule";
import { A, B, blocksFor, fakeParser } from "../_helpers/applyModule";

it("basic: emits one match block per file entry, rooted at the given path", () => {
  const blocks = blocksFor(defineModule({ contents: { "index.ts": A, "types.ts": B } }));
  expect(blocks).toHaveLength(2);
  expect(blocks[0]?.files).toEqual(["src/x/index.ts"]);
  expect(blocks[1]?.files).toEqual(["src/x/types.ts"]);
});

it("basic: composes nested folder paths via root + folder key", () => {
  const blocks = blocksFor(defineModule({ contents: { "kinds/": { "*.ts": A } } }));
  expect(blocks).toHaveLength(1);
  expect(blocks[0]?.files).toEqual(["src/x/kinds/*.ts"]);
});

it("basic: handles deep nesting", () => {
  const m = defineModule({
    contents: { "refinements/": { "applyRefinements.ts": A, "checks/": { "*.ts": B } } },
  });
  const blocks = blocksFor(m);
  expect(blocks.map((b) => b.files)).toEqual([
    ["src/x/refinements/applyRefinements.ts"],
    ["src/x/refinements/checks/*.ts"],
  ]);
});

it("basic: uses each block's templates/match rule with the right template", () => {
  const blocks = blocksFor(defineModule({ contents: { "a.ts": A, "b.ts": B } }));
  const rules = blocks.map((b) => b.rules?.["templates/match"]);
  expect(rules).toContainEqual(["error", A]);
  expect(rules).toContainEqual(["error", B]);
});

it("reuse: the same module applied to two roots yields independent block sets", () => {
  const m = defineModule({ contents: { "index.ts": A } });
  const a = applyModule({ module: m, root: "src/a", parser: fakeParser });
  const b = applyModule({ module: m, root: "src/b", parser: fakeParser });
  expect(a[0]?.files).toEqual(["src/a/index.ts"]);
  expect(b[0]?.files).toEqual(["src/b/index.ts"]);
});
