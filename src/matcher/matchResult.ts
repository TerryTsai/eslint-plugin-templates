import { type TSESTree } from "@typescript-eslint/typescript-estree";

/**
 * Identifies the kind of divergence between a file and its template.
 * The rule maps these to user-facing diagnostic messages.
 */
export type MatchMessageId =
  | "divergence"
  | "missingRequired"
  | "refinementFailed"
  | "bindingMismatch"
  | "unknownSlot"
  | "extraContent";

/**
 * A single match failure: which check failed, the data needed to format
 * the message, and the node to attach the diagnostic to.
 */
export interface MatchError {
  messageId: MatchMessageId;
  data: Record<string, string | number>;
  node: TSESTree.Node;
}

interface MatchSuccess {
  ok: true;
  bindings: Record<string, TSESTree.Node[]>;
}

/**
 * A failed match. `error.node` is where the diagnostic anchors.
 */
export interface MatchFailure {
  ok: false;
  error: MatchError;
}

/**
 * Result of matching a file against a template. Discriminated on `ok`;
 * `bindings` records which file nodes filled each slot.
 */
export type MatchResult = MatchSuccess | MatchFailure;
