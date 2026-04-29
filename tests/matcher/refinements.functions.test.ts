import { expect, it } from "vitest";

import { applyRefinements } from "../../src/matcher/refinements/applyRefinements";
import type { Slot } from "../../src/types";
import { firstStatement } from "../_helpers/parsing";

it("async:true matches async FunctionDeclaration", () => {
  const node = firstStatement(`async function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", async: true };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("async:true rejects sync function", () => {
  const node = firstStatement(`function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", async: true };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("arity: matches when params count equals arity", () => {
  const node = firstStatement(`function f(a, b) {}`);
  const slot: Slot = { type: "FunctionDeclaration", arity: 2 };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("arity: rejects when params count differs", () => {
  const node = firstStatement(`function f(a, b, c) {}`);
  const slot: Slot = { type: "FunctionDeclaration", arity: 2 };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("exported:true matches exported FunctionDeclaration", () => {
  const node = firstStatement(`export function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", exported: true };
  expect(applyRefinements(node, slot).ok).toBe(true);
});

it("exported:true rejects non-exported FunctionDeclaration", () => {
  const node = firstStatement(`function f() {}`);
  const slot: Slot = { type: "FunctionDeclaration", exported: true };
  expect(applyRefinements(node, slot).ok).toBe(false);
});

it("exported + named: checks named refinement against the unwrapped declaration", () => {
  const node = firstStatement(`export function createWidget() {}`);
  const slot: Slot = { type: "FunctionDeclaration", named: /^create/, exported: true };
  expect(applyRefinements(node, slot).ok).toBe(true);
});
