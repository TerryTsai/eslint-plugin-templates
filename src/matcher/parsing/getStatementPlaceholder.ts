import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { placeholderName } from "./placeholderName";

export function getStatementPlaceholder(node: TSESTree.Node): string | null {
  if (node.type !== "ExpressionStatement") return null;
  if (node.expression.type !== "Identifier") return null;
  return placeholderName(node.expression.name);
}
