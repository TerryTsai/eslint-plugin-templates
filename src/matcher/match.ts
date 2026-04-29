import { TSESTree } from "@typescript-eslint/typescript-estree";
import type { Slot } from "../types";
import { describeKind, nodeMatchesKind } from "./kind-mapping";
import { getStatementPlaceholder, placeholderName, type ParsedTemplate } from "./parse-template";
import { applyRefinements } from "./refinements";

export type MatchMessageId =
  | "divergence"
  | "missingRequired"
  | "refinementFailed"
  | "bindingMismatch"
  | "unknownSlot"
  | "extraContent";

export interface MatchError {
  messageId: MatchMessageId;
  data: Record<string, string | number>;
  node: TSESTree.Node;
}

export interface MatchSuccess {
  ok: true;
  bindings: Record<string, TSESTree.Node[]>;
}

export interface MatchFailure {
  ok: false;
  error: MatchError;
}

export type MatchResult = MatchSuccess | MatchFailure;

const fail = (
  messageId: MatchMessageId,
  data: MatchError["data"],
  node: TSESTree.Node,
): MatchFailure => ({ ok: false, error: { messageId, data, node } });

interface Cardinality {
  min: number;
  max: number;
}

function cardinalityOf(slot: Slot): Cardinality {
  const min = slot.minOccurs ?? 1;
  const max = slot.maxOccurs ?? (slot.minOccurs === undefined ? 1 : Infinity);
  return { min, max };
}

export function matchProgram(
  template: ParsedTemplate,
  fileAst: TSESTree.Program,
  slots: Record<string, Slot>,
): MatchResult {
  return matchSequence(template.ast.body, fileAst.body, slots, fileAst);
}

interface BindingContext {
  inline: Map<string, string>;
  mismatch: { name: string; bound: string; got: string } | null;
}

function matchSequence(
  templateNodes: readonly TSESTree.Node[],
  fileNodes: readonly TSESTree.Node[],
  slots: Record<string, Slot>,
  fallback: TSESTree.Node,
): MatchResult {
  const bindings: Record<string, TSESTree.Node[]> = {};
  const ctx: BindingContext = { inline: new Map(), mismatch: null };
  let fi = 0;

  for (const tnode of templateNodes) {
    const placeholder = getStatementPlaceholder(tnode);

    if (placeholder !== null) {
      const result = consumePlaceholder(placeholder, slots, fileNodes, fi, fallback);
      if (!result.ok) return result;
      bindings[placeholder] = result.matched;
      fi = result.nextIndex;
      continue;
    }

    const fnode = fileNodes[fi];
    if (!fnode) {
      return fail("divergence", { expected: tnode.type, found: "end-of-file" }, fallback);
    }
    if (!structurallyEqual(tnode, fnode, ctx)) {
      if (ctx.mismatch) {
        const { name, bound, got } = ctx.mismatch;
        return fail("bindingMismatch", { name, bound, got }, fnode);
      }
      return fail("divergence", { expected: tnode.type, found: fnode.type }, fnode);
    }
    fi++;
  }

  const trailing = fileNodes[fi];
  if (trailing) {
    return fail("extraContent", { found: trailing.type }, trailing);
  }
  return { ok: true, bindings };
}

interface ConsumeSuccess {
  ok: true;
  matched: TSESTree.Node[];
  nextIndex: number;
}

function consumePlaceholder(
  name: string,
  slots: Record<string, Slot>,
  fileNodes: readonly TSESTree.Node[],
  startIndex: number,
  fallback: TSESTree.Node,
): ConsumeSuccess | MatchFailure {
  const slot = slots[name];
  if (!slot) return fail("unknownSlot", { name }, fallback);

  const { min, max } = cardinalityOf(slot);
  const matched: TSESTree.Node[] = [];
  let lastRefinementFail: { node: TSESTree.Node; refinement: string } | null = null;
  let i = startIndex;

  while (i < fileNodes.length && matched.length < max) {
    const fnode = fileNodes[i]!;
    if (!nodeMatchesKind(fnode, slot.type)) break;
    const result = applyRefinements(fnode, slot);
    if (!result.ok) {
      lastRefinementFail = { node: fnode, refinement: result.failed };
      break;
    }
    matched.push(fnode);
    i++;
  }

  if (matched.length < min) {
    const type = describeKind(slot.type);
    if (lastRefinementFail) {
      const { node, refinement } = lastRefinementFail;
      return fail("refinementFailed", { name, type, refinement }, node);
    }
    const errorNode = fileNodes[i] ?? matched[matched.length - 1] ?? fallback;
    return fail("missingRequired", { name, type, minOccurs: min, found: matched.length }, errorNode);
  }
  return { ok: true, matched, nextIndex: i };
}

const LOCATION_KEYS: ReadonlySet<string> = new Set(["loc", "range", "start", "end", "parent"]);

function structurallyEqual(a: unknown, b: unknown, ctx: BindingContext): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;

  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((item, i) => structurallyEqual(item, b[i], ctx));
  }
  if (Array.isArray(b)) return false;

  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;

  // Placeholder Identifiers in the template bind on first encounter and unify on subsequent ones.
  if (ao["type"] === "Identifier" && typeof ao["name"] === "string") {
    const name = placeholderName(ao["name"]);
    if (name !== null) {
      if (bo["type"] !== "Identifier" || typeof bo["name"] !== "string") return false;
      const bound = ctx.inline.get(name);
      if (bound !== undefined) {
        if (bound !== bo["name"]) {
          ctx.mismatch = { name, bound, got: bo["name"] };
          return false;
        }
        return true;
      }
      ctx.inline.set(name, bo["name"]);
      return true;
    }
  }

  if (typeof ao["type"] === "string" && ao["type"] !== bo["type"]) return false;

  const aKeys = Object.keys(ao).filter((k) => !LOCATION_KEYS.has(k));
  if (aKeys.length !== Object.keys(bo).filter((k) => !LOCATION_KEYS.has(k)).length) return false;
  return aKeys.every((k) => k in bo && structurallyEqual(ao[k], bo[k], ctx));
}
