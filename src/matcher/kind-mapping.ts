import { TSESTree } from "@typescript-eslint/typescript-estree";
import type { NodeKind } from "../types";

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

export function unwrap(
  node: TSESTree.Node,
): { inner: TSESTree.Node; exported: boolean; isDefault: boolean } {
  if (node.type === "ExportNamedDeclaration" && node.declaration) {
    return { inner: node.declaration, exported: true, isDefault: false };
  }
  if (node.type === "ExportDefaultDeclaration") {
    return { inner: node.declaration, exported: true, isDefault: true };
  }
  return { inner: node, exported: false, isDefault: false };
}

function matchesOneKind(node: TSESTree.Node, kind: NodeKind): boolean {
  const matches = KIND_PREDICATES[kind] ?? ((n: TSESTree.Node) => n.type === kind);
  if (matches(node)) return true;
  const { inner } = unwrap(node);
  return inner !== node && matches(inner);
}

export function nodeMatchesKind(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  const kinds = Array.isArray(kind) ? kind : [kind];
  return kinds.some((k) => matchesOneKind(node, k));
}

export function describeKind(kind: NodeKind | NodeKind[]): string {
  return Array.isArray(kind) ? kind.join(" | ") : kind;
}
