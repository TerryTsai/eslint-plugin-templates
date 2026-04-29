import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function isImportTypeOnly(node: TSESTree.Node): boolean {
  return node.type === "ImportDeclaration" && node.importKind === "type";
}
