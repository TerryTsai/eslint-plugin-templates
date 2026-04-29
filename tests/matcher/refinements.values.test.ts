import { type TSESTree } from "@typescript-eslint/typescript-estree";
import { expect, it } from "vitest";

import { applyRefinements } from "../../src/matcher/refinements/applyRefinements";
import type { Slot } from "../../src/types";
import { firstExpression, parseFile } from "../_helpers/parsing";

it("matches (Literal): matches literal value against the regex", () => {
  const literal = firstExpression(`"hello-world";`);
  const slot: Slot = { type: "StringLiteral", matches: /^hello/ };
  expect(applyRefinements(literal, slot).ok).toBe(true);
});

it("matches (Literal): rejects when regex does not match", () => {
  const literal = firstExpression(`"goodbye";`);
  const slot: Slot = { type: "StringLiteral", matches: /^hello/ };
  expect(applyRefinements(literal, slot).ok).toBe(false);
});

it("optional:true matches optional property signature", () => {
  const iface = parseFile(`interface I { foo?: string; }`).body[0] as TSESTree.TSInterfaceDeclaration;
  const sig = iface.body.body[0]!;
  const slot: Slot = { type: "PropertySignature", optional: true };
  expect(applyRefinements(sig, slot).ok).toBe(true);
});

it("optional:true rejects required property signature", () => {
  const iface = parseFile(`interface I { foo: string; }`).body[0] as TSESTree.TSInterfaceDeclaration;
  const sig = iface.body.body[0]!;
  const slot: Slot = { type: "PropertySignature", optional: true };
  expect(applyRefinements(sig, slot).ok).toBe(false);
});

it("readonly:true matches readonly class property", () => {
  const cls = parseFile(`class C { readonly foo = 1; }`).body[0] as TSESTree.ClassDeclaration;
  const prop = cls.body.body[0]!;
  const slot: Slot = { type: "PropertyDeclaration", readonly: true };
  expect(applyRefinements(prop, slot).ok).toBe(true);
});

it("valueKind: matches when object property's value is the right kind", () => {
  const obj = firstExpression(`({ key: "literal" })`) as TSESTree.ObjectExpression;
  const prop = obj.properties[0]!;
  const slot: Slot = { type: "PropertyAssignment", valueKind: "Literal" };
  expect(applyRefinements(prop, slot).ok).toBe(true);
});

it("valueKind: rejects when value kind differs", () => {
  const obj = firstExpression(`({ key: () => 1 })`) as TSESTree.ObjectExpression;
  const prop = obj.properties[0]!;
  const slot: Slot = { type: "PropertyAssignment", valueKind: "Literal" };
  expect(applyRefinements(prop, slot).ok).toBe(false);
});
