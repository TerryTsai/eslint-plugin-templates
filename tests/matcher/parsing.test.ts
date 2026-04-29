import { describe, expect, it } from "vitest";

import { getStatementPlaceholder } from "../../src/matcher/parsing/getStatementPlaceholder";
import { parseTemplate } from "../../src/matcher/parsing/parseTemplate";
import { placeholderName } from "../../src/matcher/parsing/placeholderName";

describe("parseTemplate", () => {
  it("collects every ${VAR} reference in the body", () => {
    const result = parseTemplate(`
      \${IMPORTS}

      \${FUNCTIONS}
    `);
    expect(result.variableNames).toEqual(new Set(["IMPORTS", "FUNCTIONS"]));
  });

  it("produces a Program with placeholder Identifiers at top-level", () => {
    const result = parseTemplate(`\${IMPORTS}\n\${FUNCTIONS}`);
    expect(result.ast.body).toHaveLength(2);
    expect(getStatementPlaceholder(result.ast.body[0]!)).toBe("IMPORTS");
    expect(getStatementPlaceholder(result.ast.body[1]!)).toBe("FUNCTIONS");
  });

  it("ignores ${var} with non-uppercase identifiers", () => {
    const result = parseTemplate("const x = `${value}`;");
    expect(result.variableNames.size).toBe(0);
  });

  it("supports the same placeholder appearing twice", () => {
    const result = parseTemplate(`\${A}\nconst x = \${A};`);
    expect(result.variableNames).toEqual(new Set(["A"]));
  });
});

describe("placeholderName", () => {
  it("extracts the variable name from a placeholder identifier", () => {
    expect(placeholderName("__TEMPLATE_VAR_FOO_BAR__")).toBe("FOO_BAR");
  });

  it("returns null for normal identifiers", () => {
    expect(placeholderName("foo")).toBeNull();
    expect(placeholderName("__foo__")).toBeNull();
  });
});
