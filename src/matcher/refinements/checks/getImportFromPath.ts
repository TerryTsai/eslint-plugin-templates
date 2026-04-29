import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function getImportFromPath(node: TSESTree.Node): string | null {
  if (node.type !== "ImportDeclaration") return null;
  return typeof node.source.value === "string" ? node.source.value : null;
}
