import { expect, it } from "vitest";

import { matchProgram } from "../../src/matcher/matchProgram";
import { parseTemplate } from "../../src/parsing/parseTemplate";
import { type Slot } from "../../src/types";
import { parseFile } from "../_helpers/parsing";

const TEMPLATE = parseTemplate(`
  {{IMPORTS}}
  {{FUNCTIONS}}
`);

const SLOTS: Record<string, Slot> = {
  IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
  FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
};

it("matchProgram — basic: matches imports and functions against a generic template", () => {
  const file = parseFile(`
    import { a } from "a";
    import { b } from "b";
    function hello() {}
    function goodbye() {}
  `);
  const result = matchProgram(TEMPLATE, file, SLOTS);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.bindings["IMPORTS"]).toHaveLength(2);
    expect(result.bindings["FUNCTIONS"]).toHaveLength(2);
  }
});

it("matchProgram — basic: matches a file with no imports when IMPORTS is minOccurs:0", () => {
  const result = matchProgram(TEMPLATE, parseFile(`function hello() {}`), SLOTS);
  expect(result.ok).toBe(true);
});

it("matchProgram — basic: matches multiple file kinds via array type", () => {
  const tpl = parseTemplate("{{ANY}}");
  const file = parseFile(`
    const x = 1;
    function f() {}
  `);
  const slots: Record<string, Slot> = {
    ANY: { type: ["VariableDeclaration", "FunctionDeclaration"], minOccurs: 1, maxOccurs: 10 },
  };
  expect(matchProgram(tpl, file, slots).ok).toBe(true);
});
