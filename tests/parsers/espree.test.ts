import * as espree from "espree";
import { describe, expect, it } from "vitest";

import { compile } from "../../src/compile";
import { matchNode } from "../../src/match/matchNode";

const parse = (src: string): unknown =>
  espree.parse(src, { ecmaVersion: 2022, sourceType: "module" });

describe("compile against espree (ESLint's default parser)", () => {
  it("matches a conforming program", () => {
    const om = compile(`
      {{IMPORTS}}
      {{HANDLER}}
    `, {
      IMPORTS: { min: 0, max: 5, match: { type: "ImportDeclaration" } },
      HANDLER: { match: { type: "FunctionDeclaration" } },
    }, parse);

    const ast = parse(`import x from "y"; function handler() {}`);
    expect(matchNode({ match: om }, ast, new Map()).ok).toBe(true);
  });

  it("rejects a non-conforming program with a divergence reason", () => {
    const om = compile(`
      {{IMPORTS}}
      {{HANDLER}}
    `, {
      IMPORTS: { min: 0, max: 5, match: { type: "ImportDeclaration" } },
      HANDLER: { match: { type: "FunctionDeclaration" } },
    }, parse);

    const ast = parse(`function handler() {} class Extra {}`);
    expect(matchNode({ match: om }, ast, new Map()).ok).toBe(false);
  });

  it("identifier-position placeholder binds across positions", () => {
    const om = compile(`function {{NAME}}() {}\nconst ref = {{NAME}};`, {}, parse);
    expect(matchNode({ match: om }, parse(`function listUsers() {}\nconst ref = listUsers;`), new Map()).ok).toBe(true);
    expect(matchNode({ match: om }, parse(`function listUsers() {}\nconst ref = fetchUsers;`), new Map()).ok).toBe(false);
  });
});
