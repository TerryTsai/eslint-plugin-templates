import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NodeKind } from "../../../types";
import { nodeMatchesKind } from "../../kinds/nodeMatchesKind";

/**
 * True when a property's value expression is one of the listed kinds.
 * Class fields without an initializer (`value: null`) never match.
 */
export function valueKindMatches(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  if (node.type !== "Property" && node.type !== "PropertyDefinition") return false;
  return node.value !== null && nodeMatchesKind(node.value, kind);
}
