/**
 * `@bind` tag — captures on first hit, equality-checks on subsequent.
 *
 * @example
 *   { type: "Identifier", name: bind("NAME") }
 */
export function bind(name: string): { "@bind": string } {
  return { "@bind": name };
}

/**
 * `@regex` tag — RegExp test against a string target.
 *
 * @example
 *   { type: "Identifier", name: regex("^handle") }
 *   { type: "Literal", value: regex("^v\\d+", "i") }
 */
export function regex(pattern: string, flags?: string): { "@regex": string; flags?: string } {
  return flags === undefined ? { "@regex": pattern } : { "@regex": pattern, flags };
}
