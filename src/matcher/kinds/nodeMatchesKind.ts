import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NodeKind } from "../../types";

import { unwrap } from "./unwrap";

type KindPredicate = (node: TSESTree.Node) => boolean;

const KIND_PREDICATES: Record<string, KindPredicate> = {
  ImportDeclaration: (n) => n.type === "ImportDeclaration",
  FunctionDeclaration: (n) => n.type === "FunctionDeclaration",
  ArrowFunction: (n) => n.type === "ArrowFunctionExpression",
  FunctionExpression: (n) => n.type === "FunctionExpression",
  MethodDeclaration: (n) => n.type === "MethodDefinition",
  MethodSignature: (n) => n.type === "TSMethodSignature",
  PropertyAssignment: (n) => n.type === "Property",
  PropertySignature: (n) => n.type === "TSPropertySignature",
  PropertyDeclaration: (n) => n.type === "PropertyDefinition",
  StringLiteral: (n) => n.type === "Literal" && typeof n.value === "string",
  NumericLiteral: (n) => n.type === "Literal" && typeof n.value === "number",
};

/**
 * True when `node` matches the logical kind (or any kind in the array).
 * Looks through `export` wrappers — `{ type: "FunctionDeclaration" }` matches
 * both `function foo()` and `export function foo()`.
 */
export function nodeMatchesKind(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  const kinds = Array.isArray(kind) ? kind : [kind];
  return kinds.some((k) => matchesOneKind(node, k));
}

function matchesOneKind(node: TSESTree.Node, kind: NodeKind): boolean {
  const matches = KIND_PREDICATES[kind] ?? ((n: TSESTree.Node) => n.type === kind);
  const { inner } = unwrap(node);
  return matches(node) || (inner !== node && matches(inner));
}
