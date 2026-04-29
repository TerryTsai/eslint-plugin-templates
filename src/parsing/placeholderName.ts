export const PLACEHOLDER_PREFIX = "__TEMPLATE_VAR_";
export const PLACEHOLDER_SUFFIX = "__";
export const PLACEHOLDER_REGEX = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

export function placeholderName(identifierName: string): string | null {
  if (!identifierName.startsWith(PLACEHOLDER_PREFIX)) return null;
  if (!identifierName.endsWith(PLACEHOLDER_SUFFIX)) return null;
  return identifierName.slice(PLACEHOLDER_PREFIX.length, -PLACEHOLDER_SUFFIX.length);
}
