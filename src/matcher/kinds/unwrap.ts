import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * Result of looking through an `export`/`export default` wrapper.
 * `inner` is the underlying declaration; `exported`/`isDefault` describe which wrapper was present.
 */
export interface Unwrapped {
  inner: TSESTree.Node;
  exported: boolean;
  isDefault: boolean;
}

/**
 * Strip an `export` or `export default` wrapper, returning the inner declaration plus flags.
 * Used so kind/refinement checks can operate on the declaration regardless of how it was exported.
 */
export function unwrap(node: TSESTree.Node): Unwrapped {
  if (node.type === "ExportNamedDeclaration" && node.declaration) return { inner: node.declaration, exported: true, isDefault: false };
  if (node.type === "ExportDefaultDeclaration") return { inner: node.declaration, exported: true, isDefault: true };
  return { inner: node, exported: false, isDefault: false };
}
