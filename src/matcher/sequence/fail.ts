import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type MatchError, type MatchFailure, type MatchMessageId } from "../matchResult";

/**
 * Build a `MatchFailure` carrying the diagnostic data.
 * `node` is where the lint error will anchor in the file.
 */
export function fail(messageId: MatchMessageId, data: MatchError["data"], node: TSESTree.Node): MatchFailure {
  return { ok: false, error: { messageId, data, node } };
}
