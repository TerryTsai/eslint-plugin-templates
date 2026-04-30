import { matchObject } from "./matchObject";
import { type Bindings, type MatchResult, type NodeMatcher } from "./types";

/** Dispatch a NodeMatcher against a target node; prefix failures with the matcher's name. */
export function matchNode<T = unknown>(matcher: NodeMatcher<T>, target: T, bindings: Bindings): MatchResult {
  const result = matchObject(matcher.match, target, bindings);
  return result.ok || !matcher.name
    ? result
    : { ok: false, reason: result.reason, path: [`@${matcher.name}`, ...(result.path ?? [])] };
}
