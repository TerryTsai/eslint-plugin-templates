import { matchValue } from "./matchValue";
import { type Bindings, type MatchResult, type ObjectMatcher } from "./types";

/** Match each listed key on the matcher against the same key on the target. */
export function matchObject<T = Record<string, unknown>>(matcher: ObjectMatcher<T>, target: T, bindings: Bindings): MatchResult {
  if (target === null || typeof target !== "object") return { ok: false, reason: "expected object" };
  const m = matcher as Record<string, unknown>;
  const t = target as Record<string, unknown>;
  for (const key of Object.keys(m)) {
    const result = matchValue(m[key], t[key], bindings);
    if (!result.ok) return { ok: false, reason: result.reason, path: [key, ...(result.path ?? [])] };
  }
  return { ok: true };
}
