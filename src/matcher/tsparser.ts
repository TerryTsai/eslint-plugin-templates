import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

import { type NodeMatcher, type ObjectMatcher, type ValueMatcher } from "../match/types";

type Without<T, K extends string> = Omit<ObjectMatcher<T>, K>;

const node = <N extends TSESTree.Node>(type: N["type"], extras: object): NodeMatcher<N> =>
  ({ match: { type, ...extras } as ObjectMatcher<N> });

/**
 * Type-safety identity — supply `N` for autocomplete on `match`.
 *
 * @example
 *   matcher<TSESTree.FunctionDeclaration>({
 *     match: { type: "FunctionDeclaration", async: true },
 *   })
 */
export function matcher<N extends TSESTree.Node = TSESTree.Node>(m: NodeMatcher<N>): NodeMatcher<N> {
  return m;
}

// ─── Wrappers ─────────────────────────────────────────────────────

/**
 * Wraps a declaration matcher in `ExportNamedDeclaration`.
 *
 * @example
 *   exportNamedDecl(classDecl({ id: identifier("OrdersController") }))
 */
export function exportNamedDecl(decl: NodeMatcher): NodeMatcher<TSESTree.ExportNamedDeclaration> {
  return node(AST_NODE_TYPES.ExportNamedDeclaration, { declaration: decl });
}

/**
 * Wraps a declaration matcher in `ExportDefaultDeclaration`.
 *
 * @example
 *   exportDefaultDecl(functionDecl({ id: identifier("handler") }))
 */
export function exportDefaultDecl(decl: NodeMatcher): NodeMatcher<TSESTree.ExportDefaultDeclaration> {
  return node(AST_NODE_TYPES.ExportDefaultDeclaration, { declaration: decl });
}

/**
 * `ExportAllDeclaration` re-exporting from a source.
 *
 * @example
 *   exportAllDecl("./internal")
 */
export function exportAllDecl(source: ValueMatcher<string>): NodeMatcher<TSESTree.ExportAllDeclaration> {
  return node(AST_NODE_TYPES.ExportAllDeclaration, { source: literal(source) });
}

/**
 * `ImportDeclaration` from a specific source.
 *
 * @example
 *   importDecl("react")
 *   importDecl(regex("^@/components/"))
 */
export function importDecl(source: ValueMatcher<string>): NodeMatcher<TSESTree.ImportDeclaration> {
  return node(AST_NODE_TYPES.ImportDeclaration, { source: literal(source) });
}

// ─── Declarations ─────────────────────────────────────────────────

/**
 * `FunctionDeclaration`. Common keys: `id`, `async`, `params`, `body`.
 *
 * @example
 *   functionDecl({ async: true, id: identifier(regex("^handle")) })
 */
export function functionDecl(opts?: Without<TSESTree.FunctionDeclaration, "type">): NodeMatcher<TSESTree.FunctionDeclaration> {
  return node(AST_NODE_TYPES.FunctionDeclaration, opts ?? {});
}

/**
 * `ArrowFunctionExpression`. Common keys: `async`, `params`, `body`.
 *
 * @example
 *   variableDecl({ declarations: [{ match: { init: arrowFunctionExpr({ async: true }) } }] })
 */
export function arrowFunctionExpr(opts?: Without<TSESTree.ArrowFunctionExpression, "type">): NodeMatcher<TSESTree.ArrowFunctionExpression> {
  return node(AST_NODE_TYPES.ArrowFunctionExpression, opts ?? {});
}

/**
 * `ClassDeclaration`. Common keys: `id`, `decorators`, `body`, `superClass`.
 *
 * @example
 *   classDecl({
 *     id: identifier("Foo"),
 *     decorators: [decorator(callExpr({ callee: identifier("Component") }))],
 *   })
 */
export function classDecl(opts?: Without<TSESTree.ClassDeclaration, "type">): NodeMatcher<TSESTree.ClassDeclaration> {
  return node(AST_NODE_TYPES.ClassDeclaration, opts ?? {});
}

/**
 * `VariableDeclaration`. Common keys: `kind` (`"const"`/`"let"`/`"var"`), `declarations`.
 *
 * @example
 *   variableDecl({ kind: "const" })
 */
export function variableDecl(opts?: Without<TSESTree.VariableDeclaration, "type">): NodeMatcher<TSESTree.VariableDeclaration> {
  return node(AST_NODE_TYPES.VariableDeclaration, opts ?? {});
}

/**
 * `TSTypeAliasDeclaration`. Common keys: `id`, `typeAnnotation`.
 *
 * @example
 *   typeAliasDecl({ id: identifier("Result") })
 */
export function typeAliasDecl(opts?: Without<TSESTree.TSTypeAliasDeclaration, "type">): NodeMatcher<TSESTree.TSTypeAliasDeclaration> {
  return node(AST_NODE_TYPES.TSTypeAliasDeclaration, opts ?? {});
}

/**
 * `TSInterfaceDeclaration`. Common keys: `id`, `body`, `extends`.
 *
 * @example
 *   interfaceDecl({ id: identifier(regex("Props$")) })
 */
export function interfaceDecl(opts?: Without<TSESTree.TSInterfaceDeclaration, "type">): NodeMatcher<TSESTree.TSInterfaceDeclaration> {
  return node(AST_NODE_TYPES.TSInterfaceDeclaration, opts ?? {});
}

/**
 * `TSEnumDeclaration`. Common keys: `id`, `body`, `const`.
 *
 * @example
 *   enumDecl({ const: true })
 */
export function enumDecl(opts?: Without<TSESTree.TSEnumDeclaration, "type">): NodeMatcher<TSESTree.TSEnumDeclaration> {
  return node(AST_NODE_TYPES.TSEnumDeclaration, opts ?? {});
}

/**
 * `TSModuleDeclaration` (namespaces / module blocks). Common keys: `id`, `body`.
 *
 * @example
 *   moduleDecl({ id: identifier("Internal") })
 */
export function moduleDecl(opts?: Without<TSESTree.TSModuleDeclaration, "type">): NodeMatcher<TSESTree.TSModuleDeclaration> {
  return node(AST_NODE_TYPES.TSModuleDeclaration, opts ?? {});
}

// ─── Atoms ────────────────────────────────────────────────────────

/**
 * `Identifier` with a name. Accepts a string, `regex(...)`, or `bind(...)`.
 *
 * @example
 *   identifier("handler")
 *   identifier(regex("^handle"))
 *   identifier(bind("NAME"))
 */
export function identifier(name: ValueMatcher<string>): NodeMatcher<TSESTree.Identifier> {
  return node(AST_NODE_TYPES.Identifier, { name });
}

/**
 * `Literal`. Accepts string, number, boolean, null — or `regex(...)` / `bind(...)`.
 *
 * @example
 *   literal("hello")
 *   literal(42)
 *   literal(regex("^v\\d+"))
 */
export function literal(value: ValueMatcher<string | number | boolean | null>): NodeMatcher<TSESTree.Literal> {
  return node(AST_NODE_TYPES.Literal, { value });
}

/**
 * `Decorator` wrapping any expression matcher.
 *
 * @example
 *   decorator(callExpr({ callee: identifier("Controller") }))
 *   decorator(identifier("Component"))
 */
export function decorator(expression: NodeMatcher): NodeMatcher<TSESTree.Decorator> {
  return node(AST_NODE_TYPES.Decorator, { expression });
}

// ─── Class members ────────────────────────────────────────────────

/**
 * `MethodDefinition`. Common keys: `key`, `value` (FunctionExpression), `kind`, `decorators`.
 *
 * @example
 *   methodDef({ key: identifier("getUser") })
 */
export function methodDef(opts?: Without<TSESTree.MethodDefinition, "type">): NodeMatcher<TSESTree.MethodDefinition> {
  return node(AST_NODE_TYPES.MethodDefinition, opts ?? {});
}

/**
 * `PropertyDefinition` (class fields). Common keys: `key`, `value`, `decorators`, `static`, `readonly`.
 *
 * @example
 *   propertyDef({ key: identifier("count"), readonly: true })
 */
export function propertyDef(opts?: Without<TSESTree.PropertyDefinition, "type">): NodeMatcher<TSESTree.PropertyDefinition> {
  return node(AST_NODE_TYPES.PropertyDefinition, opts ?? {});
}

// ─── Expressions ──────────────────────────────────────────────────

/**
 * `CallExpression`. Common keys: `callee`, `arguments`.
 *
 * @example
 *   callExpr({ callee: identifier("describe") })
 *   callExpr({ callee: memberExpr({ object: identifier("router"), property: identifier("get") }) })
 */
export function callExpr(opts?: Without<TSESTree.CallExpression, "type">): NodeMatcher<TSESTree.CallExpression> {
  return node(AST_NODE_TYPES.CallExpression, opts ?? {});
}

/**
 * `NewExpression`. Common keys: `callee`, `arguments`.
 *
 * @example
 *   newExpr({ callee: identifier("Map") })
 */
export function newExpr(opts?: Without<TSESTree.NewExpression, "type">): NodeMatcher<TSESTree.NewExpression> {
  return node(AST_NODE_TYPES.NewExpression, opts ?? {});
}

/**
 * `MemberExpression`. Common keys: `object`, `property`, `computed`.
 *
 * @example
 *   memberExpr({ object: identifier("router"), property: identifier("get") })
 */
export function memberExpr(opts?: Without<TSESTree.MemberExpression, "type">): NodeMatcher<TSESTree.MemberExpression> {
  return node(AST_NODE_TYPES.MemberExpression, opts ?? {});
}

/**
 * `AwaitExpression` wrapping any expression matcher.
 *
 * @example
 *   awaitExpr(callExpr({ callee: identifier("fetchUser") }))
 */
export function awaitExpr(argument: NodeMatcher): NodeMatcher<TSESTree.AwaitExpression> {
  return node(AST_NODE_TYPES.AwaitExpression, { argument });
}

/**
 * `SpreadElement` wrapping any expression matcher.
 *
 * @example
 *   spreadElement(identifier("rest"))
 */
export function spreadElement(argument: NodeMatcher): NodeMatcher<TSESTree.SpreadElement> {
  return node(AST_NODE_TYPES.SpreadElement, { argument });
}

// ─── TS types ─────────────────────────────────────────────────────

/**
 * `TSTypeReference` with a name (entity name).
 *
 * @example
 *   typeRef(identifier("Promise"))
 */
export function typeRef(typeName: NodeMatcher): NodeMatcher<TSESTree.TSTypeReference> {
  return node(AST_NODE_TYPES.TSTypeReference, { typeName });
}

/**
 * `TSUnionType`. List-pairs each matcher against the union members in order.
 *
 * @example
 *   unionType([{ match: { type: "TSStringKeyword" } }, { match: { type: "TSNumberKeyword" } }])
 */
export function unionType(types: NodeMatcher<TSESTree.TypeNode>[]): NodeMatcher<TSESTree.TSUnionType> {
  return node(AST_NODE_TYPES.TSUnionType, { types });
}

/**
 * `TSIntersectionType`. List-pairs each matcher against the intersection members in order.
 *
 * @example
 *   intersectionType([typeRef(identifier("A")), typeRef(identifier("B"))])
 */
export function intersectionType(types: NodeMatcher<TSESTree.TypeNode>[]): NodeMatcher<TSESTree.TSIntersectionType> {
  return node(AST_NODE_TYPES.TSIntersectionType, { types });
}

/**
 * `TSLiteralType` (e.g. `type X = "foo"`). Wraps a `literal(...)`.
 *
 * @example
 *   literalType(literal("read"))
 */
export function literalType(literal: NodeMatcher): NodeMatcher<TSESTree.TSLiteralType> {
  return node(AST_NODE_TYPES.TSLiteralType, { literal });
}
