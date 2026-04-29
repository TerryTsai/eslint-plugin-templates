import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * The string source of an `import` declaration (e.g. `"react"`),
 * or `null` if `node` isn't an import.
 */
export function getImportFromPath(node: TSESTree.Node): string | null {
  if (node.type !== "ImportDeclaration") return null;
  return typeof node.source.value === "string" ? node.source.value : null;
}
