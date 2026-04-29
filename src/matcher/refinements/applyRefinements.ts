import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type NamedConstraint, type NodeKind, type Slot } from "../../types";
import { unwrap, type Unwrapped } from "../kinds/unwrap";

import { getFunctionArity } from "./checks/getFunctionArity";
import { getImportFromPath } from "./checks/getImportFromPath";
import { isAsyncFunction } from "./checks/isAsyncFunction";
import { isImportTypeOnly } from "./checks/isImportTypeOnly";
import { isOptionalProperty } from "./checks/isOptionalProperty";
import { isReadonlyProperty } from "./checks/isReadonlyProperty";
import { matchesLiteralValue } from "./checks/matchesLiteralValue";
import { matchesNamed } from "./checks/matchesNamed";
import { returnsKindMatches } from "./checks/returnsKindMatches";
import { valueKindMatches } from "./checks/valueKindMatches";

type RefinementResult = { ok: true } | { ok: false; failed: string };

interface RefinementBag {
  named?: NamedConstraint;
  typeOnly?: boolean;
  fromPath?: string;
  async?: boolean;
  arity?: number;
  returnsKind?: NodeKind | NodeKind[];
  exported?: boolean;
  default?: boolean;
  valueKind?: NodeKind | NodeKind[];
  optional?: boolean;
  readonly?: boolean;
  matches?: RegExp;
}

type Check = (inner: TSESTree.Node, value: unknown, wrap: Unwrapped) => boolean;

const CHECKS: Array<[keyof RefinementBag, Check]> = [
  ["named", (n, v) => matchesNamed(n, v as NamedConstraint)],
  ["typeOnly", (n, v) => isImportTypeOnly(n) === v],
  ["fromPath", (n, v) => getImportFromPath(n) === v],
  ["async", (n, v) => isAsyncFunction(n) === v],
  ["arity", (n, v) => getFunctionArity(n) === v],
  ["returnsKind", (n, v) => returnsKindMatches(n, v as NodeKind | NodeKind[])],
  ["exported", (_, v, w) => w.exported === v],
  ["default", (_, v, w) => w.isDefault === v],
  ["valueKind", (n, v) => valueKindMatches(n, v as NodeKind | NodeKind[])],
  ["optional", (n, v) => isOptionalProperty(n) === v],
  ["readonly", (n, v) => isReadonlyProperty(n) === v],
  ["matches", (n, v) => matchesLiteralValue(n, v as RegExp)],
];

export function applyRefinements(node: TSESTree.Node, slot: Slot): RefinementResult {
  const bag = slot as RefinementBag;
  const wrap = unwrap(node);
  for (const [key, check] of CHECKS) {
    const value = bag[key];
    if (value === undefined) continue;
    if (!check(wrap.inner, value, wrap)) return { ok: false, failed: key };
  }
  return { ok: true };
}
