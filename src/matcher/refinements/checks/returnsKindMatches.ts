import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NodeKind } from "../../../types";
import { nodeMatchesKind } from "../../kinds/nodeMatchesKind";

export function returnsKindMatches(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  const ann = (node as { returnType?: TSESTree.TSTypeAnnotation }).returnType;
  return ann !== undefined && nodeMatchesKind(ann.typeAnnotation, kind);
}
