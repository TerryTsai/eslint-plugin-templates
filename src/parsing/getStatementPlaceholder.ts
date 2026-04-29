import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { placeholderName } from "./placeholderName";

/**
 * Recognize a top-level `${VAR}` placeholder (parsed as `ExpressionStatement` wrapping an Identifier).
 * Returns the placeholder name or `null` for ordinary statements.
 */
export function getStatementPlaceholder(node: TSESTree.Node): string | null {
  if (node.type !== "ExpressionStatement") return null;
  if (node.expression.type !== "Identifier") return null;
  return placeholderName(node.expression.name);
}
