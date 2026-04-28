import { parse, TSESTree } from "@typescript-eslint/typescript-estree";

const PLACEHOLDER_REGEX = /\$\{([A-Z_][A-Z0-9_]*)\}/g;
const PLACEHOLDER_PREFIX = "__TEMPLATE_VAR_";
const PLACEHOLDER_SUFFIX = "__";

export interface ParsedTemplate {
  ast: TSESTree.Program;
  variableNames: Set<string>;
}

export function placeholderName(identifierName: string): string | null {
  if (!identifierName.startsWith(PLACEHOLDER_PREFIX)) return null;
  if (!identifierName.endsWith(PLACEHOLDER_SUFFIX)) return null;
  return identifierName.slice(PLACEHOLDER_PREFIX.length, -PLACEHOLDER_SUFFIX.length);
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

export function getStatementPlaceholder(node: TSESTree.Node): string | null {
  if (node.type !== "ExpressionStatement") return null;
  if (node.expression.type !== "Identifier") return null;
  return placeholderName(node.expression.name);
}

export function getExpressionPlaceholder(node: TSESTree.Node): string | null {
  if (node.type !== "Identifier") return null;
  return placeholderName(node.name);
}
