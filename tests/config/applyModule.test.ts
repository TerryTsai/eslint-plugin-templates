import { describe, expect, it } from "vitest";

import { applyModule } from "../../src/config/applyModule";
import { defineModule } from "../../src/config/defineModule";
import { type MatchTemplate } from "../../src/types";

const A: MatchTemplate = { id: "a", body: "" };
const B: MatchTemplate = { id: "b", body: "" };
const C: MatchTemplate = { id: "c", body: "" };

const fakeParser = { parse: () => ({}) };

function blocksFor(module: ReturnType<typeof defineModule>, root = "src/x") {
  return applyModule({ module, root, parser: fakeParser });
}

describe("applyModule — basic expansion", () => {
  it("emits one match block per file entry, rooted at the given path", () => {
    const blocks = blocksFor(defineModule({ contents: { "index.ts": A, "types.ts": B } }));
    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.files).toEqual(["src/x/index.ts"]);
    expect(blocks[1]?.files).toEqual(["src/x/types.ts"]);
  });

  it("composes nested folder paths via `${root}/${folderKey}`", () => {
    const blocks = blocksFor(defineModule({ contents: { "kinds/": { "*.ts": A } } }));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.files).toEqual(["src/x/kinds/*.ts"]);
  });

  it("handles deep nesting", () => {
    const m = defineModule({
      contents: { "refinements/": { "applyRefinements.ts": A, "checks/": { "*.ts": B } } },
    });
    const blocks = blocksFor(m);
    expect(blocks.map((b) => b.files)).toEqual([
      ["src/x/refinements/applyRefinements.ts"],
      ["src/x/refinements/checks/*.ts"],
    ]);
  });

  it("uses each block's templates/match rule with the right template", () => {
    const blocks = blocksFor(defineModule({ contents: { "a.ts": A, "b.ts": B } }));
    const rules = blocks.map((b) => b.rules?.["templates/match"]);
    expect(rules).toContainEqual(["error", A]);
    expect(rules).toContainEqual(["error", B]);
  });
});

describe("applyModule — sibling specificity ordering", () => {
  it("sorts within a folder so most-specific is emitted last (ESLint's last-wins)", () => {
    const m = defineModule({ contents: { "*.ts": A, "*.test.ts": B, "index.ts": C } });
    const blocks = blocksFor(m);
    const globs = blocks.map((b) => b.files[0]);
    expect(globs).toEqual(["src/x/*.ts", "src/x/*.test.ts", "src/x/index.ts"]);
  });

  it("ignores the order keys were written in", () => {
    const m = defineModule({ contents: { "index.ts": C, "*.ts": A } });
    const blocks = blocksFor(m);
    expect(blocks.map((b) => b.files[0])).toEqual(["src/x/*.ts", "src/x/index.ts"]);
  });
});

describe("applyModule — closed scope", () => {
  it("emits a forbid block over the folder when closed is true", () => {
    const m = defineModule({ contents: { "index.ts": A }, closed: true });
    const blocks = blocksFor(m);
    expect(blocks).toHaveLength(2);
    const forbid = blocks[1];
    expect(forbid?.files).toEqual(["src/x/*.ts"]);
    expect(forbid?.ignores).toEqual(["src/x/index.ts"]);
    expect(forbid?.rules?.["templates/forbid"]).toEqual([
      "error",
      { message: "This file is not allowed in the current scope." },
    ]);
  });

  it("respects custom extensions and message", () => {
    const m = defineModule({
      contents: { "index.ts": A },
      closed: { extensions: ["ts", "tsx"], message: "service folders only contain index.ts" },
    });
    const blocks = blocksFor(m);
    const forbid = blocks[blocks.length - 1];
    expect(forbid?.files).toEqual(["src/x/*.ts", "src/x/*.tsx"]);
    expect(forbid?.rules?.["templates/forbid"]).toEqual([
      "error",
      { message: "service folders only contain index.ts" },
    ]);
  });

  it("nested modules own their own closed scope independently", () => {
    const m = defineModule({
      contents: { "kinds/": defineModule({ contents: { "*.ts": A }, closed: true }) },
    });
    const blocks = blocksFor(m);
    expect(blocks.find((b) => b.files.includes("src/x/kinds/*.ts"))).toBeDefined();
    expect(blocks.find((b) => b.name?.startsWith("templates:closed@src/x/kinds"))).toBeDefined();
    expect(blocks.find((b) => b.name?.startsWith("templates:closed@src/x") && !b.name.includes("/kinds"))).toBeUndefined();
  });
});

describe("applyModule — reuse across roots", () => {
  it("the same module applied to two roots yields independent block sets", () => {
    const m = defineModule({ contents: { "index.ts": A } });
    const a = applyModule({ module: m, root: "src/a", parser: fakeParser });
    const b = applyModule({ module: m, root: "src/b", parser: fakeParser });
    expect(a[0]?.files).toEqual(["src/a/index.ts"]);
    expect(b[0]?.files).toEqual(["src/b/index.ts"]);
  });
});

describe("applyModule — block naming", () => {
  it("each match block carries a name with the template id and glob", () => {
    const blocks = blocksFor(defineModule({ contents: { "index.ts": A } }));
    expect(blocks[0]?.name).toBe("templates:a@src/x/index.ts");
  });

  it("each forbid block carries a name with the closed path", () => {
    const blocks = blocksFor(defineModule({ contents: { "index.ts": A }, closed: true }));
    expect(blocks[blocks.length - 1]?.name).toBe("templates:closed@src/x");
  });
});
