import { parse, type TSESTree } from "@typescript-eslint/typescript-estree";

export function parseFile(source: string): TSESTree.Program {
  return parse(source, { loc: true, range: true, jsx: false });
}

export function firstStatement(source: string): TSESTree.Node {
  return parseFile(source).body[0]!;
}

export function firstExpression(source: string): TSESTree.Node {
  const stmt = firstStatement(source);
  if (stmt.type !== "ExpressionStatement") throw new Error("expected ExpressionStatement");
  return stmt.expression;
}
