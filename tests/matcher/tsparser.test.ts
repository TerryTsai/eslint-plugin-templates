import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import { matchNode } from "../../src/match/matchNode";
import { type NodeMatcher } from "../../src/match/types";
import { bind, regex } from "../../src/matcher/common";
import {
  callExpr,
  classDecl,
  decorator,
  exportDefaultDecl,
  exportNamedDecl,
  functionDecl,
  identifier,
  importDecl,
  intersectionType,
  literal,
  methodDef,
  unionType,
} from "../../src/matcher/tsparser";
import { parseFile } from "../helpers/parsing";

const matches = (m: NodeMatcher, target: unknown): boolean =>
  matchNode(m, target as Record<string, unknown>, new Map()).ok;
const node = (src: string): unknown => parseFile(src).body[0];
const expr = (src: string): unknown => (parseFile(src).body[0] as { expression: unknown }).expression;

describe("tsparser helpers", () => {
  it("exportNamedDecl wraps a class", () => {
    const m = exportNamedDecl(classDecl({ id: identifier("X") }));
    expect(matches(m, node(`export class X {}`))).toBe(true);
    expect(matches(m, node(`class X {}`))).toBe(false);
  });

  it("exportDefaultDecl wraps a function", () => {
    const m = exportDefaultDecl(functionDecl());
    expect(matches(m, node(`export default function f() {}`))).toBe(true);
  });

  it("importDecl matches a specific source", () => {
    const m = importDecl("react");
    expect(matches(m, node(`import { useState } from "react";`))).toBe(true);
    expect(matches(m, node(`import { x } from "vue";`))).toBe(false);
  });

  it("identifier accepts string, regex, and bind", () => {
    expect(matches(identifier("x"), expr(`x;`))).toBe(true);
    expect(matches(identifier(regex("^h")), expr(`handler;`))).toBe(true);
    expect(matches(identifier(regex("^h")), expr(`noop;`))).toBe(false);
    expect(matches(identifier(bind("N")), expr(`anything;`))).toBe(true);
  });

  it("literal matches primitive values", () => {
    expect(matches(literal("hello"), expr(`"hello";`))).toBe(true);
    expect(matches(literal("nope"), expr(`"hello";`))).toBe(false);
  });

  it("decorator + methodDef + classDecl compose", () => {
    const m = classDecl({
      decorators: [decorator(callExpr({ callee: identifier("Controller") }))],
      body: { match: { body: [methodDef({ key: identifier("get") })] } },
    });
    expect(matches(m, node(`@Controller("orders") class X { get() {} }`))).toBe(true);
  });

  it("unionType list-pairs against TypeNode children", () => {
    const m = unionType([
      { match: { type: AST_NODE_TYPES.TSStringKeyword } },
      { match: { type: AST_NODE_TYPES.TSNumberKeyword } },
    ]);
    const decl = node(`type T = string | number;`) as { typeAnnotation: unknown };
    expect(matches(m, decl.typeAnnotation)).toBe(true);
  });

  it("intersectionType list-pairs against TypeNode children", () => {
    const m = intersectionType([
      { match: { type: AST_NODE_TYPES.TSTypeReference } },
      { match: { type: AST_NODE_TYPES.TSTypeReference } },
    ]);
    const decl = node(`type T = A & B;`) as { typeAnnotation: unknown };
    expect(matches(m, decl.typeAnnotation)).toBe(true);
  });
});
