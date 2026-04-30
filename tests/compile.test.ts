import * as parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";

import { compile } from "../src/compile";
import { matchNode } from "../src/match/matchNode";

import { parseFile } from "./helpers/parsing";

const parse = (src: string): unknown =>
  parser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

describe("compile", () => {
  it("returns an ObjectMatcher that matches a conforming program", () => {
    const om = compile(`
      {{IMPORTS}}
      {{HANDLER}}
    `, {
      IMPORTS: { min: 0, match: { type: "ImportDeclaration" } },
      HANDLER: { match: { type: "FunctionDeclaration" } },
    }, parse);
    const file = parseFile(`import x from "y";\nfunction handler() {}`);
    expect(matchNode({ match: om }, file as unknown as Record<string, unknown>, new Map()).ok).toBe(true);
  });

  it("statement-level placeholder requires a matcher in the map", () => {
    expect(() => compile(`{{IMPORTS}}`, {}, parse)).toThrow(/IMPORTS/);
  });

  it("inline placeholder uses bind for cross-position consistency", () => {
    const om = compile(`function {{NAME}}() {}\nexport { {{NAME}} };`, {}, parse);
    const ok = parseFile(`function listUsers() {}\nexport { listUsers };`);
    const bad = parseFile(`function listUsers() {}\nexport { fetchUsers };`);
    expect(matchNode({ match: om }, ok as unknown as Record<string, unknown>, new Map()).ok).toBe(true);
    expect(matchNode({ match: om }, bad as unknown as Record<string, unknown>, new Map()).ok).toBe(false);
  });
});
