import { matchList } from "./matchList";
import { matchNode } from "./matchNode";
import { type Bindings, type MatchResult, type NodeMatcher, type ValueMatcher } from "./types";

/** Dispatch on the matcher's runtime form against a target value. */
export function matchValue<T = unknown>(matcher: ValueMatcher<T> | undefined, target: T, bindings: Bindings): MatchResult {
  if (matcher === undefined) return { ok: true };
  if (matcher === null || typeof matcher !== "object") return literal(matcher, target);
  if (Array.isArray(matcher)) return composite(matcher, target, bindings);
  return structural(matcher, target, bindings);
}

function literal(expected: unknown, target: unknown): MatchResult {
  return target === expected
    ? { ok: true }
    : { ok: false, reason: `expected ${String(expected)}, got ${String(target)}` };
}

function composite(matcher: unknown[], target: unknown, bindings: Bindings): MatchResult {
  if (Array.isArray(target)) return matchList(matcher as NodeMatcher[], target, bindings);
  return alternate(matcher, target, bindings);
}

function alternate(alternatives: unknown[], target: unknown, bindings: Bindings): MatchResult {
  for (const alt of alternatives) {
    const r = matchValue(alt, target, bindings);
    if (r.ok) return r;
  }
  return { ok: false, reason: "no alternative matched" };
}

function structural(matcher: object, target: unknown, bindings: Bindings): MatchResult {
  if ("@regex" in matcher) return regexTag(matcher as { "@regex": string; flags?: string }, target);
  if ("@bind" in matcher) return bindTag(matcher as { "@bind": string }, target, bindings);
  return matchNode(matcher as NodeMatcher, target, bindings);
}

function regexTag(matcher: { "@regex": string; flags?: string }, target: unknown): MatchResult {
  if (typeof target !== "string") return { ok: false, reason: "expected string for @regex" };
  const re = regexCache.get(matcher) ?? compileRegex(matcher);
  return re.test(target)
    ? { ok: true }
    : { ok: false, reason: `expected ${re}, got "${target}"` };
}

const regexCache = new WeakMap<object, RegExp>();

function compileRegex(matcher: { "@regex": string; flags?: string }): RegExp {
  const re = new RegExp(matcher["@regex"], matcher.flags);
  regexCache.set(matcher, re);
  return re;
}

function bindTag(matcher: { "@bind": string }, target: unknown, bindings: Bindings): MatchResult {
  const name = matcher["@bind"];
  if (!bindings.has(name)) {
    bindings.set(name, target);
    return { ok: true };
  }
  return bindings.get(name) === target
    ? { ok: true }
    : { ok: false, reason: `"${name}" was bound to ${String(bindings.get(name))} but found ${String(target)}` };
}
