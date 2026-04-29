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

it("matchProgram — errors: rejects a file missing required functions", () => {
  const result = matchProgram(TEMPLATE, parseFile(`import { a } from "a";`), SLOTS);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.messageId).toBe("missingRequired");
    expect(result.error.data["name"]).toBe("FUNCTIONS");
  }
});

it("matchProgram — errors: rejects a file with a forbidden top-level node", () => {
  const file = parseFile(`
    import { a } from "a";
    const x = 1;
    function hello() {}
  `);
  expect(matchProgram(TEMPLATE, file, SLOTS).ok).toBe(false);
});

it("matchProgram — errors: respects maxOccurs as upper bound", () => {
  const tpl = parseTemplate("{{FUNCTIONS}}");
  const file = parseFile(`function a(){} function b(){}`);
  const slots: Record<string, Slot> = {
    FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1, maxOccurs: 1 },
  };
  expect(matchProgram(tpl, file, slots).ok).toBe(false);
});

it("matchProgram — errors: reports unknownSlot for placeholders without a matching slot definition", () => {
  const result = matchProgram(parseTemplate("{{MISSING}}"), parseFile(``), {});
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.messageId).toBe("unknownSlot");
});
