import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * True when the property is declared with `?`
 * (interface, type, or class property).
 */
export function isOptionalProperty(node: TSESTree.Node): boolean {
  return "optional" in node && node.optional === true;
}
