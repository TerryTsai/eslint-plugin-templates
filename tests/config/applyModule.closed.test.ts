import { expect, it } from "vitest";

import { defineModule } from "../../src/config/defineModule";
import { A, blocksFor } from "../_helpers/applyModule";

it("closed scope: emits a forbid block over the folder when closed is true", () => {
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

it("closed scope: respects custom extensions and message", () => {
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

it("closed scope: nested modules own their own scope independently", () => {
  const m = defineModule({
    contents: { "kinds/": defineModule({ contents: { "*.ts": A }, closed: true }) },
  });
  const blocks = blocksFor(m);
  expect(blocks.find((b) => b.files.includes("src/x/kinds/*.ts"))).toBeDefined();
  expect(blocks.find((b) => b.name?.startsWith("templates:closed@src/x/kinds"))).toBeDefined();
  const outer = blocks.find((b) => b.name?.startsWith("templates:closed@src/x") && !b.name.includes("/kinds"));
  expect(outer).toBeUndefined();
});

it("closed propagation: parent's closed applies to descendants that don't set their own", () => {
  const m = defineModule({
    closed: { message: "locked" },
    contents: {
      "index.ts": A,
      "kinds/": { "*.ts": A },
      "deep/": { "inner/": { "*.ts": A } },
    },
  });
  const blocks = blocksFor(m);
  const closedNames = blocks.filter((b) => b.name?.startsWith("templates:closed@")).map((b) => b.name);
  expect(closedNames).toContain("templates:closed@src/x");
  expect(closedNames).toContain("templates:closed@src/x/kinds");
  expect(closedNames).toContain("templates:closed@src/x/deep");
  expect(closedNames).toContain("templates:closed@src/x/deep/inner");
  const inheritedForbid = blocks.find((b) => b.name === "templates:closed@src/x/kinds");
  expect(inheritedForbid?.rules?.["templates/forbid"]).toEqual(["error", { message: "locked" }]);
});

it("closed propagation: a child's own closed overrides the inherited spec", () => {
  const m = defineModule({
    closed: { message: "outer" },
    contents: {
      "kinds/": defineModule({
        closed: { message: "inner" },
        contents: { "*.ts": A },
      }),
    },
  });
  const blocks = blocksFor(m);
  const inner = blocks.find((b) => b.name === "templates:closed@src/x/kinds");
  expect(inner?.rules?.["templates/forbid"]).toEqual(["error", { message: "inner" }]);
});
