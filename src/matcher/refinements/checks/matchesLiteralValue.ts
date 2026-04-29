import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * Test the `regex` against `String(node.value)` of a string/number `Literal`.
 * Non-Literals and `null`-valued literals never match.
 */
export function matchesLiteralValue(node: TSESTree.Node, regex: RegExp): boolean {
  if (node.type !== "Literal" || node.value === null) return false;
  return regex.test(String(node.value));
}
