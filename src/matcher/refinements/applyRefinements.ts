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

type RefineFn<K extends keyof RefinementBag> = (
  inner: TSESTree.Node,
  value: NonNullable<RefinementBag[K]>,
  wrap: Unwrapped,
) => boolean;

interface RefineEntry {
  apply: (bag: RefinementBag, inner: TSESTree.Node, wrap: Unwrapped) => RefinementResult | null;
}

const CHECKS: RefineEntry[] = [
  entry("named", (n, v) => matchesNamed(n, v)),
  entry("typeOnly", (n, v) => isImportTypeOnly(n) === v),
  entry("fromPath", (n, v) => getImportFromPath(n) === v),
  entry("async", (n, v) => isAsyncFunction(n) === v),
  entry("arity", (n, v) => getFunctionArity(n) === v),
  entry("returnsKind", (n, v) => returnsKindMatches(n, v)),
  entry("exported", (_, v, w) => w.exported === v),
  entry("default", (_, v, w) => w.isDefault === v),
  entry("valueKind", (n, v) => valueKindMatches(n, v)),
  entry("optional", (n, v) => isOptionalProperty(n) === v),
  entry("readonly", (n, v) => isReadonlyProperty(n) === v),
  entry("matches", (n, v) => matchesLiteralValue(n, v)),
];

/**
 * Run every refinement declared on `slot` against `node` and return the first
 * failure (or `{ ok: true }`). The schema guarantees only refinements valid
 * for the slot's variant are present.
 */
export function applyRefinements(node: TSESTree.Node, slot: Slot): RefinementResult {
  const bag = slot as RefinementBag;
  const wrap = unwrap(node);
  for (const e of CHECKS) {
    const result = e.apply(bag, wrap.inner, wrap);
    if (result) return result;
  }
  return { ok: true };
}

/**
 * Build a `RefineEntry` that closes over the per-key types. Hides the generic
 * `K` behind a uniform `apply` method so the dispatch loop in
 * `applyRefinements` doesn't need any casts to call into a heterogeneous
 * collection of typed checks.
 */
function entry<K extends keyof RefinementBag>(key: K, fn: RefineFn<K>): RefineEntry {
  return {
    apply(bag, inner, wrap) {
      const value = bag[key];
      if (value === undefined) return null;
      return fn(inner, value, wrap) ? null : { ok: false, failed: key };
    },
  };
}
