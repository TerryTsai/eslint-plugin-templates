import type { TSESTree } from "@typescript-eslint/typescript-estree";
import type { NamedConstraint, NodeKind, Slot } from "../types";
import { nodeMatchesKind, unwrap } from "./kind-mapping";

export type RefinementResult = { ok: true } | { ok: false; failed: string };

const PASS: RefinementResult = { ok: true };
const fail = (failed: string): RefinementResult => ({ ok: false, failed });

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

export function applyRefinements(node: TSESTree.Node, slot: Slot): RefinementResult {
  const v = slot as RefinementBag;
  const { inner, exported, isDefault } = unwrap(node);

  if (v.named !== undefined && !matchesNamed(inner, v.named)) return fail("named");
  if (v.typeOnly !== undefined && isImportTypeOnly(inner) !== v.typeOnly) return fail("typeOnly");
  if (v.fromPath !== undefined && getImportFromPath(inner) !== v.fromPath) return fail("fromPath");
  if (v.async !== undefined && isAsyncFunction(inner) !== v.async) return fail("async");
  if (v.arity !== undefined && getFunctionArity(inner) !== v.arity) return fail("arity");
  if (v.returnsKind !== undefined && !returnsKindMatches(inner, v.returnsKind)) return fail("returnsKind");
  if (v.exported !== undefined && exported !== v.exported) return fail("exported");
  if (v.default !== undefined && isDefault !== v.default) return fail("default");
  if (v.valueKind !== undefined && !valueKindMatches(inner, v.valueKind)) return fail("valueKind");
  if (v.optional !== undefined && isOptionalProperty(inner) !== v.optional) return fail("optional");
  if (v.readonly !== undefined && isReadonlyProperty(inner) !== v.readonly) return fail("readonly");
  if (v.matches !== undefined && !matchesLiteralValue(inner, v.matches)) return fail("matches");
  return PASS;
}

function getName(node: TSESTree.Node): string | null {
  if ("id" in node && node.id && "name" in node.id && typeof node.id.name === "string") {
    return node.id.name;
  }
  if ("key" in node && node.key) {
    if ("name" in node.key && typeof node.key.name === "string") return node.key.name;
    if (node.key.type === "Literal" && typeof node.key.value === "string") return node.key.value;
  }
  return null;
}

function matchesNamed(node: TSESTree.Node, constraint: NamedConstraint): boolean {
  const name = getName(node);
  if (name === null) return false;
  return constraint instanceof RegExp ? constraint.test(name) : constraint === name;
}

function isImportTypeOnly(node: TSESTree.Node): boolean {
  return node.type === "ImportDeclaration" && node.importKind === "type";
}

function getImportFromPath(node: TSESTree.Node): string | null {
  if (node.type !== "ImportDeclaration") return null;
  return typeof node.source.value === "string" ? node.source.value : null;
}

function isAsyncFunction(node: TSESTree.Node): boolean {
  return "async" in node && node.async === true;
}

function getFunctionArity(node: TSESTree.Node): number | null {
  return "params" in node && Array.isArray(node.params) ? node.params.length : null;
}

function returnsKindMatches(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  const ann = (node as { returnType?: TSESTree.TSTypeAnnotation }).returnType;
  return ann !== undefined && nodeMatchesKind(ann.typeAnnotation, kind);
}

function valueKindMatches(node: TSESTree.Node, kind: NodeKind | NodeKind[]): boolean {
  if (node.type !== "Property" && node.type !== "PropertyDefinition") return false;
  return node.value !== null && nodeMatchesKind(node.value, kind);
}

function isOptionalProperty(node: TSESTree.Node): boolean {
  return "optional" in node && node.optional === true;
}

function isReadonlyProperty(node: TSESTree.Node): boolean {
  return "readonly" in node && node.readonly === true;
}

function matchesLiteralValue(node: TSESTree.Node, regex: RegExp): boolean {
  if (node.type !== "Literal" || node.value === null) return false;
  return regex.test(String(node.value));
}
