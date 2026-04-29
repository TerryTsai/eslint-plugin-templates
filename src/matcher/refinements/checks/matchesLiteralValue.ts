import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function matchesLiteralValue(node: TSESTree.Node, regex: RegExp): boolean {
  if (node.type !== "Literal" || node.value === null) return false;
  return regex.test(String(node.value));
}
