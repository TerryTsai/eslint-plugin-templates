import { type NodeKind } from "../../types";

/**
 * Format a kind (or array of kinds) for use in a diagnostic message:
 * arrays become `"A | B | C"`.
 */
export function describeKind(kind: NodeKind | NodeKind[]): string {
  return Array.isArray(kind) ? kind.join(" | ") : kind;
}
