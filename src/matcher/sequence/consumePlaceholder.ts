import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type Slot } from "../../types";
import { describeKind } from "../kinds/describeKind";
import { nodeMatchesKind } from "../kinds/nodeMatchesKind";
import { applyRefinements } from "../refinements/applyRefinements";

import { cardinalityOf } from "./cardinalityOf";
import { fail } from "./fail";
import { type MatchFailure } from "./matchResult";

export interface ConsumeSuccess {
  ok: true;
  matched: TSESTree.Node[];
  nextIndex: number;
}

interface ConsumeState {
  matched: TSESTree.Node[];
  lastRefinementFail: { node: TSESTree.Node; refinement: string } | null;
  nextIndex: number;
}

export function consumePlaceholder(
  name: string,
  slots: Record<string, Slot>,
  fileNodes: readonly TSESTree.Node[],
  startIndex: number,
  fallback: TSESTree.Node,
): ConsumeSuccess | MatchFailure {
  const slot = slots[name];
  if (!slot) return fail("unknownSlot", { name }, fallback);
  const { min, max } = cardinalityOf(slot);
  const state = consumeMatching(slot, fileNodes, startIndex, max);
  if (state.matched.length >= min) return { ok: true, matched: state.matched, nextIndex: state.nextIndex };
  return reportInsufficient(name, slot, state, min, fileNodes, fallback);
}

function consumeMatching(slot: Slot, fileNodes: readonly TSESTree.Node[], startIndex: number, max: number): ConsumeState {
  const state: ConsumeState = { matched: [], lastRefinementFail: null, nextIndex: startIndex };
  while (state.nextIndex < fileNodes.length && state.matched.length < max) {
    if (!tryAdvance(slot, fileNodes[state.nextIndex]!, state)) break;
  }
  return state;
}

function tryAdvance(slot: Slot, fnode: TSESTree.Node, state: ConsumeState): boolean {
  if (!nodeMatchesKind(fnode, slot.type)) return false;
  const result = applyRefinements(fnode, slot);
  if (!result.ok) {
    state.lastRefinementFail = { node: fnode, refinement: result.failed };
    return false;
  }
  state.matched.push(fnode);
  state.nextIndex++;
  return true;
}

function reportInsufficient(
  name: string,
  slot: Slot,
  state: ConsumeState,
  min: number,
  fileNodes: readonly TSESTree.Node[],
  fallback: TSESTree.Node,
): MatchFailure {
  const type = describeKind(slot.type);
  if (state.lastRefinementFail) {
    const { node, refinement } = state.lastRefinementFail;
    return fail("refinementFailed", { name, type, refinement }, node);
  }
  const errorNode = fileNodes[state.nextIndex] ?? state.matched.at(-1) ?? fallback;
  return fail("missingRequired", { name, type, minOccurs: min, found: state.matched.length }, errorNode);
}
