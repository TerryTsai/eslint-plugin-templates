import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * True when the node has `async: true`
 * (function declaration, arrow, expression, or method).
 */
export function isAsyncFunction(node: TSESTree.Node): boolean {
  return "async" in node && node.async === true;
}
