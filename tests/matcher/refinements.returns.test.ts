import { expect, it } from "vitest";

import { applyRefinements } from "../../src/matcher/refinements/applyRefinements";
import type { Slot } from "../../src/types";
import { firstStatement } from "../_helpers/parsing";

it("default:true matches default-exported FunctionDeclaration", () => {
  const node = firstStatement(`export default function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", default: true };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("default:true rejects named-exported FunctionDeclaration", () => {
  const node = firstStatement(`export function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", default: true };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("returnsKind: matches when return type matches the requested AST kind", () => {
  const node = firstStatement(`function f(): string { return ""; }`);
  const slot: Slot = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("returnsKind: matches with an array of kinds", () => {
  const node = firstStatement(`function f(): number { return 1; }`);
  const slot: Slot = {
    type: "FunctionDeclaration",
    returnsKind: ["TSStringKeyword", "TSNumberKeyword"],
  };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("returnsKind: rejects when the return type differs", () => {
  const node = firstStatement(`function f(): boolean { return true; }`);
  const slot: Slot = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("returnsKind: rejects when there is no return type annotation", () => {
  const node = firstStatement(`function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", returnsKind: "TSStringKeyword" };
  expect(applyRefinements(node, slot).ok).toBe(false);
});
