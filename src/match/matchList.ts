import { matchNode } from "./matchNode";
import { type Bindings, type MatchResult, type NodeMatcher } from "./types";

/** Greedy list pairing: each matcher consumes targets up to its `max`. */
export function matchList<T = unknown>(matchers: NodeMatcher<T>[], target: T[], bindings: Bindings): MatchResult {
  let i = 0;
  for (let mi = 0; mi < matchers.length; mi++) {
    const r = consume(matchers[mi]!, target, i, bindings);
    if (!r.ok) return { ok: false, reason: r.reason, path: [mi, ...(r.path ?? [])] };
    i = r.next;
  }
  return i < target.length
    ? { ok: false, reason: `unexpected extra item at index ${i}`, path: [i] }
    : { ok: true };
}

function consume<T>(matcher: NodeMatcher<T>, target: T[], start: number, bindings: Bindings) {
  const { min, max } = bounds(matcher);
  let count = 0; let i = start;
  while (count < max && i < target.length) {
    if (!matchNode(matcher, target[i]!, bindings).ok) break;
    count++; i++;
  }
  return count < min
    ? { ok: false as const, reason: `expected at least ${min}, got ${count}`, path: undefined }
    : { ok: true as const, next: i };
}

function bounds<T>(m: NodeMatcher<T>): { min: number; max: number } {
  const min = m.min ?? 1;
  const max = m.max ?? (m.min === undefined ? 1 : Infinity);
  return { min, max };
}
