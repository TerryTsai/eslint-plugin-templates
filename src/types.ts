/**
 * Logical AST kind name (e.g. `"FunctionDeclaration"`, `"ArrowFunction"`).
 * Some logical kinds map to TSESTree types with different names — see `kinds/nodeMatchesKind`.
 */
export type NodeKind = string;

/**
 * Constraint on a node's identifier name.
 * Strings match exactly; RegExps test against the name.
 */
export type NamedConstraint = string | RegExp;

/**
 * Fields shared by every slot variant.
 * Cardinality defaults to exactly one when neither bound is set.
 */
export interface BaseSlot {
  minOccurs?: number;
  maxOccurs?: number;
  named?: NamedConstraint;
}

/**
 * Slot for `import` declarations.
 * `typeOnly` requires `import type`; `fromPath` matches the source string exactly.
 */
export interface ImportSlot extends BaseSlot {
  type: "ImportDeclaration";
  typeOnly?: boolean;
  fromPath?: string;
}

export type FunctionKind =
  | "FunctionDeclaration"
  | "ArrowFunction"
  | "FunctionExpression"
  | "MethodDeclaration"
  | "MethodSignature";

/**
 * Slot for function-shaped nodes.
 * `exported`/`default` consult the export wrapper; other refinements apply to the unwrapped declaration.
 */
export interface FunctionSlot extends BaseSlot {
  type: FunctionKind;
  async?: boolean;
  arity?: number;
  returnsKind?: NodeKind | NodeKind[];
  exported?: boolean;
  default?: boolean;
}

export type PropertyKind = "PropertyAssignment" | "PropertySignature" | "PropertyDeclaration";

/**
 * Slot for object/interface/class properties.
 * `valueKind` is the kind of the property's value expression.
 */
export interface PropertySlot extends BaseSlot {
  type: PropertyKind;
  valueKind?: NodeKind | NodeKind[];
  optional?: boolean;
  readonly?: boolean;
}

export type LiteralKind = "StringLiteral" | "NumericLiteral";

/**
 * Slot for string/number literals.
 * `matches` tests against `String(node.value)`.
 */
export interface LiteralSlot extends BaseSlot {
  type: LiteralKind;
  matches?: RegExp;
}

/**
 * Fallback slot for AST kinds without specialized refinements,
 * or for matching multiple kinds at once via array `type`.
 */
export interface AnySlot extends BaseSlot {
  type: NodeKind | NodeKind[];
}

/**
 * Discriminated union of slot variants.
 * The schema rejects cross-variant refinements (e.g. `arity` on an `ImportSlot`) at config-load time.
 */
export type Slot =
  | ImportSlot
  | FunctionSlot
  | PropertySlot
  | LiteralSlot
  | AnySlot;

/**
 * A template definition.
 * `id` for diagnostic messages, `body` containing literal AST + `${SLOT}` placeholders,
 * and `slots` declaring each placeholder's shape.
 */
export interface MatchTemplate {
  id: string;
  body: string;
  slots?: Record<string, Slot>;
}
