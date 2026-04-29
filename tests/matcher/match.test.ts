import { parse } from "@typescript-eslint/typescript-estree";
import { describe, expect, it } from "vitest";

import { matchProgram } from "../../src/matcher/matchProgram";
import { parseTemplate } from "../../src/parsing/parseTemplate";
import { type Slot } from "../../src/types";

function parseFile(source: string) {
  return parse(source, { loc: true, range: true, jsx: false });
}

describe("matchProgram", () => {
  it("matches a file with imports and functions against a generic template", () => {
    const tpl = parseTemplate(`\${IMPORTS}\n\${FUNCTIONS}`);
    const file = parseFile(`
      import { a } from "a";
      import { b } from "b";
      function hello() {}
      function goodbye() {}
    `);
    const slots: Record<string, Slot> = {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
      FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bindings["IMPORTS"]).toHaveLength(2);
      expect(result.bindings["FUNCTIONS"]).toHaveLength(2);
    }
  });

  it("matches a file with no imports when IMPORTS is minOccurs:0", () => {
    const tpl = parseTemplate(`\${IMPORTS}\n\${FUNCTIONS}`);
    const file = parseFile(`function hello() {}`);
    const slots: Record<string, Slot> = {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
      FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(true);
  });

  it("rejects a file missing required functions", () => {
    const tpl = parseTemplate(`\${IMPORTS}\n\${FUNCTIONS}`);
    const file = parseFile(`import { a } from "a";`);
    const slots: Record<string, Slot> = {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
      FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.messageId).toBe("missingRequired");
      expect(result.error.data["name"]).toBe("FUNCTIONS");
    }
  });

  it("rejects a file with a forbidden top-level node", () => {
    const tpl = parseTemplate(`\${IMPORTS}\n\${FUNCTIONS}`);
    const file = parseFile(`
      import { a } from "a";
      const x = 1;
      function hello() {}
    `);
    const slots: Record<string, Slot> = {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
      FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(false);
  });

  it("respects maxOccurs as upper bound", () => {
    const tpl = parseTemplate(`\${FUNCTIONS}`);
    const file = parseFile(`function a(){} function b(){}`);
    const slots: Record<string, Slot> = {
      FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1, maxOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(false);
  });

  it("reports unknownSlot for placeholders without a matching slot definition", () => {
    const tpl = parseTemplate(`\${MISSING}`);
    const file = parseFile(``);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.messageId).toBe("unknownSlot");
    }
  });

  it("matches multiple file kinds via array type", () => {
    const tpl = parseTemplate(`\${ANY}`);
    const file = parseFile(`
      const x = 1;
      function f() {}
    `);
    const slots: Record<string, Slot> = {
      ANY: { type: ["VariableDeclaration", "FunctionDeclaration"], minOccurs: 1, maxOccurs: 10 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(true);
  });

  it("unifies inline placeholders across positions when names agree", () => {
    const tpl = parseTemplate(`function \${NAME}() {}\nexport { \${NAME} };`);
    const file = parseFile(`function helloWorld() {}\nexport { helloWorld };`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(true);
  });

  it("rejects when an inline placeholder is bound to two different identifiers", () => {
    const tpl = parseTemplate(`function \${NAME}() {}\nexport { \${NAME} };`);
    const file = parseFile(`function helloWorld() {}\nexport { goodbye };`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.messageId).toBe("bindingMismatch");
      expect(result.error.data["bound"]).toBe("helloWorld");
      expect(result.error.data["got"]).toBe("goodbye");
    }
  });

  it("matches a literal-only template against an exact file", () => {
    const tpl = parseTemplate(`import { useState } from "react";`);
    const file = parseFile(`import { useState } from "react";`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(true);
  });

  it("rejects a literal template when the file's literal differs", () => {
    const tpl = parseTemplate(`import { useState } from "react";`);
    const file = parseFile(`import { useEffect } from "react";`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.messageId).toBe("divergence");
  });

  it("matches a literal statement followed by a placeholder slot", () => {
    const tpl = parseTemplate(`import { useState } from "react";\n\${HOOKS}`);
    const file = parseFile(`
      import { useState } from "react";
      function useThing() {}
      function useOther() {}
    `);
    const slots: Record<string, Slot> = {
      HOOKS: { type: "FunctionDeclaration", minOccurs: 1, maxOccurs: 5 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(true);
  });

  it("rejects when the literal portion diverges even though slots could match", () => {
    const tpl = parseTemplate(`import { useState } from "react";\n\${HOOKS}`);
    const file = parseFile(`
      import { useEffect } from "react";
      function useThing() {}
    `);
    const slots: Record<string, Slot> = {
      HOOKS: { type: "FunctionDeclaration", minOccurs: 1 },
    };
    const result = matchProgram(tpl, file, slots);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.messageId).toBe("divergence");
  });

  it("matches a literal shell with an inline placeholder for the function name", () => {
    const tpl = parseTemplate(`export function \${NAME}() { return null; }`);
    const file = parseFile(`export function widget() { return null; }`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(true);
  });

  it("rejects when the literal body of an inline-placeholder shell does not match", () => {
    const tpl = parseTemplate(`export function \${NAME}() { return null; }`);
    const file = parseFile(`export function widget() { return 42; }`);
    const result = matchProgram(tpl, file, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.messageId).toBe("divergence");
  });
});
