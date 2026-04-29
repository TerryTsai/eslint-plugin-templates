import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { getStatementPlaceholder } from "../../parsing/getStatementPlaceholder";
import { type Slot } from "../../types";
import { type MatchResult } from "../matchResult";

import { type BindingContext, bindingContext } from "./bindingContext";
import { consumePlaceholder } from "./consumePlaceholder";
import { fail } from "./fail";
import { structurallyEqual } from "./structurallyEqual";

interface SequenceState {
  bindings: Record<string, TSESTree.Node[]>;
  ctx: BindingContext;
  fi: number;
}

/**
 * Walk template statements left-to-right against `fileNodes`, advancing through
 * the file as each template node is satisfied. Placeholder statements consume
 * per slot rules; literal template AST must match the file's next node exactly.
 * Trailing file content fails as `extraContent`.
 */
export function matchSequence(
  templateNodes: readonly TSESTree.Node[],
  fileNodes: readonly TSESTree.Node[],
  slots: Record<string, Slot>,
  fallback: TSESTree.Node,
): MatchResult {
  const state: SequenceState = { bindings: {}, ctx: bindingContext(), fi: 0 };
  for (const tnode of templateNodes) {
    const error = stepOne(tnode, fileNodes, slots, fallback, state);
    if (error !== null) return error;
  }
  const trailing = fileNodes[state.fi];
  if (trailing) return fail("extraContent", { found: trailing.type }, trailing);
  return { ok: true, bindings: state.bindings };
}

function stepOne(
  tnode: TSESTree.Node,
  fileNodes: readonly TSESTree.Node[],
  slots: Record<string, Slot>,
  fallback: TSESTree.Node,
  state: SequenceState,
): MatchResult | null {
  const placeholder = getStatementPlaceholder(tnode);
  if (placeholder !== null) return stepPlaceholder(placeholder, fileNodes, slots, fallback, state);
  return stepLiteral(tnode, fileNodes, fallback, state);
}

function stepPlaceholder(
  name: string,
  fileNodes: readonly TSESTree.Node[],
  slots: Record<string, Slot>,
  fallback: TSESTree.Node,
  state: SequenceState,
): MatchResult | null {
  const result = consumePlaceholder(name, slots, fileNodes, state.fi, fallback);
  if (!result.ok) return result;
  state.bindings[name] = result.matched;
  state.fi = result.nextIndex;
  return null;
}

function stepLiteral(
  tnode: TSESTree.Node,
  fileNodes: readonly TSESTree.Node[],
  fallback: TSESTree.Node,
  state: SequenceState,
): MatchResult | null {
  const fnode = fileNodes[state.fi];
  if (!fnode) return fail("divergence", { expected: tnode.type, found: "end-of-file" }, fallback);
  if (!structurallyEqual(tnode, fnode, state.ctx)) return reportLiteralFailure(tnode, fnode, state.ctx);
  state.fi++;
  return null;
}

function reportLiteralFailure(tnode: TSESTree.Node, fnode: TSESTree.Node, ctx: BindingContext): MatchResult {
  if (ctx.mismatch) {
    const { name, bound, got } = ctx.mismatch;
    return fail("bindingMismatch", { name, bound, got }, fnode);
  }
  return fail("divergence", { expected: tnode.type, found: fnode.type }, fnode);
}
