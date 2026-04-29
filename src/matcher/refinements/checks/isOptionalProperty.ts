import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function isOptionalProperty(node: TSESTree.Node): boolean {
  return "optional" in node && node.optional === true;
}
