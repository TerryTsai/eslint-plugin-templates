/** Prefix wrapped around a `${VAR}` placeholder so the result is a valid JS identifier. */
export const PLACEHOLDER_PREFIX = "__TEMPLATE_VAR_";
/** Suffix paired with `PLACEHOLDER_PREFIX`. */
export const PLACEHOLDER_SUFFIX = "__";
/** Matches `${VAR}` syntax in a template body — uppercase letters, digits, and underscores only. */
export const PLACEHOLDER_REGEX = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

/**
 * Recover a placeholder's original name from its wrapped identifier,
 * or `null` if the identifier wasn't produced by `parseTemplate`.
 */
export function placeholderName(identifierName: string): string | null {
  if (!identifierName.startsWith(PLACEHOLDER_PREFIX)) return null;
  if (!identifierName.endsWith(PLACEHOLDER_SUFFIX)) return null;
  return identifierName.slice(PLACEHOLDER_PREFIX.length, -PLACEHOLDER_SUFFIX.length);
}
