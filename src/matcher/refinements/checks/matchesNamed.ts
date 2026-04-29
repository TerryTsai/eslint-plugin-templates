import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NamedConstraint } from "../../../types";
import { getName } from "../../kinds/getName";

/**
 * Test a node's identifier name against the constraint.
 * Strings match exactly; RegExps `.test` the name. Nodes without a name never match.
 */
export function matchesNamed(node: TSESTree.Node, constraint: NamedConstraint): boolean {
  const name = getName(node);
  if (name === null) return false;
  return constraint instanceof RegExp ? constraint.test(name) : constraint === name;
}
