import { parse, type TSESTree } from "@typescript-eslint/typescript-estree";

import { PLACEHOLDER_PREFIX, PLACEHOLDER_REGEX, PLACEHOLDER_SUFFIX } from "./placeholderName";

/**
 * A template body that has been preprocessed and parsed once.
 * `variableNames` is the set of `${VAR}` references found in the body.
 */
export interface ParsedTemplate {
  ast: TSESTree.Program;
  variableNames: Set<string>;
}

/**
 * Preprocess `${VAR}` placeholders into unique identifiers, then parse the result
 * so the matcher can walk a real AST. The placeholder identifiers are recognized
 * later by `placeholderName`.
 */
export function parseTemplate(body: string): ParsedTemplate {
  const variableNames = new Set<string>();
  const source = body.replace(PLACEHOLDER_REGEX, (_, name: string) => {
    variableNames.add(name);
    return `${PLACEHOLDER_PREFIX}${name}${PLACEHOLDER_SUFFIX}`;
  });
  const ast = parse(source, { loc: true, range: true, jsx: false, comment: false });
  return { ast, variableNames };
}
