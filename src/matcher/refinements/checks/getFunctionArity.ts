import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * Number of parameters declared on a function-like node,
 * or `null` if `node` has no `params`.
 */
export function getFunctionArity(node: TSESTree.Node): number | null {
  return "params" in node && Array.isArray(node.params) ? node.params.length : null;
}
