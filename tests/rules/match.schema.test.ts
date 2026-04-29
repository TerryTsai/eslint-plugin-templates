import Ajv from "ajv";
import { expect, it } from "vitest";

import { matchRuleSchema } from "../../src/rules/match.schema";

const ajv = new Ajv({ allErrors: false });
const validate = ajv.compile(matchRuleSchema[0]!);

const valid = (template: unknown): boolean => validate(template) as boolean;
const validWith = (slotX: unknown): boolean =>
  valid({ id: "x", body: "{{X}}", slots: { X: slotX } });

it("schema: accepts a minimal template", () => {
  expect(valid({ id: "x", body: "" })).toBe(true);
});

it("schema: requires id and body", () => {
  expect(valid({ id: "x" })).toBe(false);
  expect(valid({ body: "" })).toBe(false);
});

it("schema: rejects unknown top-level fields on the template", () => {
  expect(valid({ id: "x", body: "", weird: 1 })).toBe(false);
});

it("variants: accepts ImportSlot with typeOnly + fromPath", () => {
  expect(validWith({ type: "ImportDeclaration", typeOnly: true, fromPath: "react" })).toBe(true);
});

it("variants: rejects ImportSlot with FunctionSlot refinement", () => {
  expect(validWith({ type: "ImportDeclaration", arity: 2 })).toBe(false);
});

it("variants: accepts FunctionSlot across all five function-like kinds", () => {
  const kinds = ["FunctionDeclaration", "ArrowFunction", "FunctionExpression", "MethodDeclaration", "MethodSignature"];
  for (const k of kinds) {
    expect(validWith({ type: k, async: true, arity: 0 })).toBe(true);
  }
});

it("variants: rejects FunctionSlot with valueKind (PropertySlot refinement)", () => {
  expect(validWith({ type: "FunctionDeclaration", valueKind: "Literal" })).toBe(false);
});

it("variants: accepts LiteralSlot with matches", () => {
  expect(validWith({ type: "StringLiteral", matches: /foo/ })).toBe(true);
});

it("variants: accepts AnySlot with non-specialized kind", () => {
  expect(validWith({ type: "VariableDeclaration", minOccurs: 0 })).toBe(true);
});

it("variants: accepts AnySlot with array of kinds", () => {
  expect(validWith({ type: ["VariableDeclaration", "FunctionDeclaration"] })).toBe(true);
});

it("variants: rejects unknown refinement on a specialized variant", () => {
  expect(validWith({ type: "ImportDeclaration", weird: 1 })).toBe(false);
});

it("base fields: accepts minOccurs and maxOccurs as non-negative integers", () => {
  expect(validWith({ type: "ImportDeclaration", minOccurs: 0, maxOccurs: 5 })).toBe(true);
});

it("base fields: rejects negative minOccurs", () => {
  expect(validWith({ type: "ImportDeclaration", minOccurs: -1 })).toBe(false);
});

it("base fields: accepts named as string or RegExp object", () => {
  expect(validWith({ type: "FunctionDeclaration", named: "exact" })).toBe(true);
  expect(validWith({ type: "FunctionDeclaration", named: /pattern/ })).toBe(true);
});
