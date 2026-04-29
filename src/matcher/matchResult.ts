import { type TSESTree } from "@typescript-eslint/typescript-estree";

export type MatchMessageId = "divergence" | "missingRequired" | "refinementFailed" | "bindingMismatch" | "unknownSlot" | "extraContent";

export interface MatchError {
  messageId: MatchMessageId;
  data: Record<string, string | number>;
  node: TSESTree.Node;
}

interface MatchSuccess {
  ok: true;
  bindings: Record<string, TSESTree.Node[]>;
}

export interface MatchFailure {
  ok: false;
  error: MatchError;
}

export type MatchResult = MatchSuccess | MatchFailure;
