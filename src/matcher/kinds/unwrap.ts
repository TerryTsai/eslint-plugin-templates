import { type TSESTree } from "@typescript-eslint/typescript-estree";

export interface Unwrapped {
  inner: TSESTree.Node;
  exported: boolean;
  isDefault: boolean;
}

export function unwrap(node: TSESTree.Node): Unwrapped {
  if (node.type === "ExportNamedDeclaration" && node.declaration) return { inner: node.declaration, exported: true, isDefault: false };
  if (node.type === "ExportDefaultDeclaration") return { inner: node.declaration, exported: true, isDefault: true };
  return { inner: node, exported: false, isDefault: false };
}
