import { expect, it } from "vitest";

import { matchProgram } from "../../src/matcher/matchProgram";
import { parseTemplate } from "../../src/parsing/parseTemplate";
import { parseFile } from "../_helpers/parsing";

const TEMPLATE = parseTemplate(`
  function {{NAME}}() {}
  export { {{NAME}} };
`);

it("matchProgram — binding: unifies inline placeholders across positions when names agree", () => {
  const file = parseFile(`
    function helloWorld() {}
    export { helloWorld };
  `);
  expect(matchProgram(TEMPLATE, file, {}).ok).toBe(true);
});

it("matchProgram — binding: rejects when an inline placeholder is bound to two different identifiers", () => {
  const file = parseFile(`
    function helloWorld() {}
    export { goodbye };
  `);
  const result = matchProgram(TEMPLATE, file, {});
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.messageId).toBe("bindingMismatch");
    expect(result.error.data["bound"]).toBe("helloWorld");
    expect(result.error.data["got"]).toBe("goodbye");
  }
});
