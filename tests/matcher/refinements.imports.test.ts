import { expect, it } from "vitest";

import { applyRefinements } from "../../src/matcher/refinements/applyRefinements";
import type { Slot } from "../../src/types";
import { firstStatement } from "../_helpers/parsing";

it("named: matches FunctionDeclaration by name string", () => {
  const node = firstStatement(`function createWidget() {}`);
  const slot: Slot = { type: "FunctionDeclaration", named: "createWidget" };
  expect(applyRefinements(node, slot)).toEqual({ ok: true });
});

it("named: matches FunctionDeclaration by RegExp", () => {
  const node = firstStatement(`function createWidget() {}`);
  const slot: Slot = { type: "FunctionDeclaration", named: /^create[A-Z]/ };
  expect(applyRefinements(node, slot)).toEqual({ ok: true });
});

it("named: rejects FunctionDeclaration with mismatched name", () => {
  const node = firstStatement(`function destroyWidget() {}`);
  const slot: Slot = { type: "FunctionDeclaration", named: /^create/ };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("typeOnly:true matches `import type` declarations", () => {
  const node = firstStatement(`import type { Foo } from "bar";`);
  const slot: Slot = { type: "ImportDeclaration", typeOnly: true };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("typeOnly:true rejects regular imports", () => {
  const node = firstStatement(`import { Foo } from "bar";`);
  const slot: Slot = { type: "ImportDeclaration", typeOnly: true };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("typeOnly:false matches regular imports", () => {
  const node = firstStatement(`import { Foo } from "bar";`);
  const slot: Slot = { type: "ImportDeclaration", typeOnly: false };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("fromPath: matches imports from the specified path", () => {
  const node = firstStatement(`import { Foo } from "bar";`);
  const slot: Slot = { type: "ImportDeclaration", fromPath: "bar" };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("fromPath: rejects imports from a different path", () => {
  const node = firstStatement(`import { Foo } from "baz";`);
  const slot: Slot = { type: "ImportDeclaration", fromPath: "bar" };
  expect(applyRefinements(node, slot).ok).toBe(false);
});
