import { type TSESTree } from "@typescript-eslint/typescript-estree";

export function getName(node: TSESTree.Node): string | null {
  return nameFromId(node) ?? nameFromDeclarations(node) ?? nameFromKey(node);
}

function nameFromId(node: TSESTree.Node): string | null {
  if (!("id" in node) || !node.id) return null;
  return identifierName(node.id);
}

function nameFromDeclarations(node: TSESTree.Node): string | null {
  if (node.type !== "VariableDeclaration" || node.declarations.length !== 1) return null;
  const first = node.declarations[0];
  return first?.id ? identifierName(first.id) : null;
}

function nameFromKey(node: TSESTree.Node): string | null {
  if (!("key" in node) || !node.key) return null;
  return identifierName(node.key) ?? literalStringValue(node.key);
}

function identifierName(node: TSESTree.Node): string | null {
  if (!("name" in node) || typeof node.name !== "string") return null;
  return node.name;
}

function literalStringValue(node: TSESTree.Node): string | null {
  if (node.type !== "Literal" || typeof node.value !== "string") return null;
  return node.value;
}
