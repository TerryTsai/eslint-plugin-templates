import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NodeKind } from "../../../types";
import { nodeMatchesKind } from "../../kinds/nodeMatchesKind";

/**
 * True when the function's declared return type annotation is one of the listed kinds.
 * Functions without a return type annotation never match.
 */
export function returnsKindMatches(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  const ann = (node as { returnType?: TSESTree.TSTypeAnnotation }).returnType;
  return ann !== undefined && nodeMatchesKind(ann.typeAnnotation, kind);
}
