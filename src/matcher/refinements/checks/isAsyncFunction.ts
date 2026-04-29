import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function isAsyncFunction(node: TSESTree.Node): boolean {
  return "async" in node && node.async === true;
}
