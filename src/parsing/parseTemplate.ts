import { parse, type TSESTree } from "@typescript-eslint/typescript-estree";

import { PLACEHOLDER_PREFIX, PLACEHOLDER_REGEX, PLACEHOLDER_SUFFIX } from "./placeholderName";

export interface ParsedTemplate {
  ast: TSESTree.Program;
  variableNames: Set<string>;
}

export function parseTemplate(body: string): ParsedTemplate {
  const variableNames = new Set<string>();
  const source = body.replace(PLACEHOLDER_REGEX, (_, name: string) => {
    variableNames.add(name);
    return `${PLACEHOLDER_PREFIX}${name}${PLACEHOLDER_SUFFIX}`;
  });
  const ast = parse(source, { loc: true, range: true, jsx: false, comment: false });
  return { ast, variableNames };
}
