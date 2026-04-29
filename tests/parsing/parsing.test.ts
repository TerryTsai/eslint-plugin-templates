import { expect, it } from "vitest";

import { getStatementPlaceholder } from "../../src/parsing/getStatementPlaceholder";
import { parseTemplate } from "../../src/parsing/parseTemplate";
import { placeholderName } from "../../src/parsing/placeholderName";

it("parseTemplate: collects every {{VAR}} reference in the body", () => {
  const result = parseTemplate(`
    {{IMPORTS}}

    {{FUNCTIONS}}
  `);
  expect(result.variableNames).toEqual(new Set(["IMPORTS", "FUNCTIONS"]));
});

it("parseTemplate: produces a Program with placeholder Identifiers at top-level", () => {
  const result = parseTemplate(`
    {{IMPORTS}}
    {{FUNCTIONS}}
  `);
  expect(result.ast.body).toHaveLength(2);
  expect(getStatementPlaceholder(result.ast.body[0]!)).toBe("IMPORTS");
  expect(getStatementPlaceholder(result.ast.body[1]!)).toBe("FUNCTIONS");
});

it("parseTemplate: ignores {{var}} with non-uppercase identifiers", () => {
  const result = parseTemplate("const x = '{{value}}';");
  expect(result.variableNames.size).toBe(0);
});

it("parseTemplate: supports the same placeholder appearing twice", () => {
  const result = parseTemplate(`
    {{A}}
    const x = {{A}};
  `);
  expect(result.variableNames).toEqual(new Set(["A"]));
});

it("placeholderName: extracts the variable name from a placeholder identifier", () => {
  expect(placeholderName("__TEMPLATE_VAR_FOO_BAR__")).toBe("FOO_BAR");
});

it("placeholderName: returns null for normal identifiers", () => {
  expect(placeholderName("foo")).toBeNull();
  expect(placeholderName("__foo__")).toBeNull();
});
