import type { TSESTree } from "@typescript-eslint/utils";

import { type NodeMatcher } from "./match/types";

/** Cross-position binding tag — the engine captures on first hit, checks on subsequent. */
export function bind(name: string): { "@bind": string } {
  return { "@bind": name };
}

/** Regex tag for testing string targets. */
export function regex(pattern: string, flags?: string): { "@regex": string; flags?: string } {
  return flags === undefined ? { "@regex": pattern } : { "@regex": pattern, flags };
}

/** Type-safety identity — supply `N` (a TSESTree node type) for autocomplete on `match`. */
export function matcher<N extends TSESTree.Node = TSESTree.Node>(m: NodeMatcher<N>): NodeMatcher<N> {
  return m;
}
