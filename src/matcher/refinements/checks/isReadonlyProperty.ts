import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function isReadonlyProperty(node: TSESTree.Node): boolean {
  return "readonly" in node && node.readonly === true;
}
