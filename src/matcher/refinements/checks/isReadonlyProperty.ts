import { type TSESTree } from "@typescript-eslint/typescript-estree";

/** True when the property is declared `readonly`. */
export function isReadonlyProperty(node: TSESTree.Node): boolean {
  return "readonly" in node && node.readonly === true;
}
