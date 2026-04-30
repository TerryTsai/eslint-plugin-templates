import * as parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { matchConfig } from "../../src/config";
import { type NodeMatcher } from "../../src/match/types";

const T: NodeMatcher = { name: "T", match: {} };

describe("matchConfig", () => {
  it("captures files+template+severity, passes the rest through", () => {
    const block = matchConfig({
      files: "src/*.ts",
      template: T,
      severity: "warn",
      languageOptions: { parser },
      settings: { x: 1 },
    });
    expect(block.files).toEqual(["src/*.ts"]);
    expect(block.languageOptions?.parser).toBe(parser);
    expect(block.settings).toEqual({ x: 1 });
    expect(block.rules?.["templates/match"]).toEqual(["warn", T]);
  });

  it("merges user plugins with the templates plugin", () => {
    const userPlugin = { rules: {} };
    const block = matchConfig({ files: "x.ts", template: T, plugins: { extra: userPlugin } });
    expect(block.plugins?.extra).toBe(userPlugin);
    expect(block.plugins?.templates).toBeDefined();
  });

  it("user-supplied rule wins on collision", () => {
    const userOpts: ["off"] = ["off"];
    const block = matchConfig({ files: "x.ts", template: T, rules: { "templates/match": userOpts } });
    expect(block.rules?.["templates/match"]).toBe(userOpts);
  });
});
