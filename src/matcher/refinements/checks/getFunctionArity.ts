import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function getFunctionArity(node: TSESTree.Node): number | null {
  return "params" in node && Array.isArray(node.params) ? node.params.length : null;
}
