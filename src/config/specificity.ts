/**
 * Compare two file-key patterns by specificity for sibling ordering.
 * More-specific keys should appear LATER in the emitted config so ESLint's
 * last-wins semantics applies the most-specific rule. Specificity:
 * fewer wildcards is more specific; ties broken by literal-character count
 * (more literal characters = more specific).
 *
 * Returns negative when `a` is LESS specific than `b` (sorts earlier).
 */
export function compareSpecificity(a: string, b: string): number {
  const aWild = countWildcards(a);
  const bWild = countWildcards(b);
  if (aWild !== bWild) return bWild - aWild;
  return literalChars(a) - literalChars(b);
}

function countWildcards(pattern: string): number {
  return (pattern.match(/\*/g) ?? []).length;
}

function literalChars(pattern: string): number {
  return pattern.replace(/\*/g, "").length;
}
