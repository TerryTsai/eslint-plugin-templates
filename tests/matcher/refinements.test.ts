import { parse, type TSESTree } from "@typescript-eslint/typescript-estree";
import { describe, expect, it } from "vitest";
import { applyRefinements } from "../../src/matcher/refinements";
import type { Variable } from "../../src/types";

function parseSource(source: string): TSESTree.Program {
  return parse(source, { loc: true, range: true, jsx: false });
}

function firstStatement(source: string): TSESTree.Node {
  return parseSource(source).body[0]!;
}

function firstExpression(source: string): TSESTree.Node {
  const stmt = firstStatement(source);
  if (stmt.type !== "ExpressionStatement") throw new Error("expected ExpressionStatement");
  return stmt.expression;
}

describe("named", () => {
  it("matches FunctionDeclaration by name string", () => {
    const node = firstStatement(`function createWidget() {}`);
    const variable: Variable = { type: "FunctionDeclaration", named: "createWidget" };
    expect(applyRefinements(node, variable)).toEqual({ ok: true });
  });

  it("matches FunctionDeclaration by RegExp", () => {
    const node = firstStatement(`function createWidget() {}`);
    const variable: Variable = { type: "FunctionDeclaration", named: /^create[A-Z]/ };
    expect(applyRefinements(node, variable)).toEqual({ ok: true });
  });

  it("rejects FunctionDeclaration with mismatched name", () => {
    const node = firstStatement(`function destroyWidget() {}`);
    const variable: Variable = { type: "FunctionDeclaration", named: /^create/ };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });
});

describe("typeOnly", () => {
  it("matches `import type` declarations when typeOnly:true", () => {
    const node = firstStatement(`import type { Foo } from "bar";`);
    const variable: Variable = { type: "ImportDeclaration", typeOnly: true };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects regular imports when typeOnly:true", () => {
    const node = firstStatement(`import { Foo } from "bar";`);
    const variable: Variable = { type: "ImportDeclaration", typeOnly: true };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });

  it("matches regular imports when typeOnly:false", () => {
    const node = firstStatement(`import { Foo } from "bar";`);
    const variable: Variable = { type: "ImportDeclaration", typeOnly: false };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });
});

describe("fromPath", () => {
  it("matches imports from the specified path", () => {
    const node = firstStatement(`import { Foo } from "bar";`);
    const variable: Variable = { type: "ImportDeclaration", fromPath: "bar" };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects imports from a different path", () => {
    const node = firstStatement(`import { Foo } from "baz";`);
    const variable: Variable = { type: "ImportDeclaration", fromPath: "bar" };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });
});

describe("async", () => {
  it("matches async FunctionDeclaration when async:true", () => {
    const node = firstStatement(`async function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", async: true };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects sync function when async:true", () => {
    const node = firstStatement(`function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", async: true };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });
});

describe("arity", () => {
  it("matches when params count equals arity", () => {
    const node = firstStatement(`function f(a, b) {}`);
    const variable: Variable = { type: "FunctionDeclaration", arity: 2 };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects when params count differs", () => {
    const node = firstStatement(`function f(a, b, c) {}`);
    const variable: Variable = { type: "FunctionDeclaration", arity: 2 };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });
});

describe("matches (Literal)", () => {
  it("matches literal value against the regex", () => {
    const literal = firstExpression(`"hello-world";`);
    const variable: Variable = { type: "StringLiteral", matches: /^hello/ };
    expect(applyRefinements(literal, variable).ok).toBe(true);
  });

  it("rejects when regex does not match", () => {
    const literal = firstExpression(`"goodbye";`);
    const variable: Variable = { type: "StringLiteral", matches: /^hello/ };
    expect(applyRefinements(literal, variable).ok).toBe(false);
  });
});

describe("optional / readonly (TS property signatures)", () => {
  it("matches optional property signature", () => {
    const iface = parseSource(`interface I { foo?: string; }`).body[0] as TSESTree.TSInterfaceDeclaration;
    const sig = iface.body.body[0]!;
    const variable: Variable = { type: "PropertySignature", optional: true };
    expect(applyRefinements(sig, variable).ok).toBe(true);
  });

  it("rejects required property signature when optional:true", () => {
    const iface = parseSource(`interface I { foo: string; }`).body[0] as TSESTree.TSInterfaceDeclaration;
    const sig = iface.body.body[0]!;
    const variable: Variable = { type: "PropertySignature", optional: true };
    expect(applyRefinements(sig, variable).ok).toBe(false);
  });

  it("matches readonly class property", () => {
    const cls = parseSource(`class C { readonly foo = 1; }`).body[0] as TSESTree.ClassDeclaration;
    const prop = cls.body.body[0]!;
    const variable: Variable = { type: "PropertyDeclaration", readonly: true };
    expect(applyRefinements(prop, variable).ok).toBe(true);
  });
});

describe("exported / default", () => {
  it("matches exported FunctionDeclaration when exported:true", () => {
    const node = firstStatement(`export function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", exported: true };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects non-exported FunctionDeclaration when exported:true", () => {
    const node = firstStatement(`function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", exported: true };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });

  it("matches default-exported FunctionDeclaration when default:true", () => {
    const node = firstStatement(`export default function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", default: true };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects named-exported when default:true", () => {
    const node = firstStatement(`export function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", default: true };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });

  it("checks named refinement against the unwrapped declaration", () => {
    const node = firstStatement(`export function createWidget() {}`);
    const variable: Variable = { type: "FunctionDeclaration", named: /^create/, exported: true };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });
});

describe("returnsKind", () => {
  it("matches when the return type matches the requested AST kind", () => {
    const node = firstStatement(`function f(): string { return ""; }`);
    const variable: Variable = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("matches with an array of kinds", () => {
    const node = firstStatement(`function f(): number { return 1; }`);
    const variable: Variable = {
      type: "FunctionDeclaration",
      returnsKind: ["TSStringKeyword", "TSNumberKeyword"],
    };
    expect(applyRefinements(node, variable).ok).toBe(true);
  });

  it("rejects when the return type differs", () => {
    const node = firstStatement(`function f(): boolean { return true; }`);
    const variable: Variable = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });

  it("rejects when there is no return type annotation", () => {
    const node = firstStatement(`function f() {}`);
    const variable: Variable = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
    expect(applyRefinements(node, variable).ok).toBe(false);
  });
});

describe("valueKind", () => {
  it("matches when object property's value is the right kind", () => {
    const obj = firstExpression(`({ key: "literal" })`) as TSESTree.ObjectExpression;
    const prop = obj.properties[0]!;
    const variable: Variable = { type: "PropertyAssignment", valueKind: "Literal" };
    expect(applyRefinements(prop, variable).ok).toBe(true);
  });

  it("rejects when value kind differs", () => {
    const obj = firstExpression(`({ key: () => 1 })`) as TSESTree.ObjectExpression;
    const prop = obj.properties[0]!;
    const variable: Variable = { type: "PropertyAssignment", valueKind: "Literal" };
    expect(applyRefinements(prop, variable).ok).toBe(false);
  });
});
