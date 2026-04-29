import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NamedConstraint } from "../../../types";
import { getName } from "../../kinds/getName";

export function matchesNamed(node: TSESTree.Node, constraint: NamedConstraint): boolean {
  const name = getName(node);
  if (name === null) return false;
  return constraint instanceof RegExp ? constraint.test(name) : constraint === name;
}
