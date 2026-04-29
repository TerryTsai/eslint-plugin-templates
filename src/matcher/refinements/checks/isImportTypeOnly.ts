import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * True when the node is `import type { … }`
 * (not a value import or type-import alias on a value import).
 */
export function isImportTypeOnly(node: TSESTree.Node): boolean {
  return node.type === "ImportDeclaration" && node.importKind === "type";
}
