import { type NodeKind } from "../../types";

export function describeKind(kind: NodeKind | NodeKind[]): string {
  return Array.isArray(kind) ? kind.join(" | ") : kind;
}
