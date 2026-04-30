import { describe, expect, it } from "vitest";

import { forbidConfig } from "../../src/config";

describe("forbidConfig", () => {
  it("captures files/ignores/message/severity, passes the rest through", () => {
    const block = forbidConfig({
      files: "src/x/*.ts",
      ignores: ["src/x/index.ts"],
      message: "no extras",
      severity: "warn",
      settings: { y: 2 },
    });
    expect(block.files).toEqual(["src/x/*.ts"]);
    expect(block.ignores).toEqual(["src/x/index.ts"]);
    expect(block.rules?.["templates/forbid"]).toEqual(["warn", { message: "no extras" }]);
    expect(block.settings).toEqual({ y: 2 });
  });

  it("omits ignores when empty", () => {
    const block = forbidConfig({ files: "x.ts" });
    expect(block.ignores).toBeUndefined();
  });
});
