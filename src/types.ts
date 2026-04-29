export type NodeKind = string;

export type NamedConstraint = string | RegExp;

export interface BaseSlot {
  minOccurs?: number;
  maxOccurs?: number;
  named?: NamedConstraint;
}

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

export interface FunctionSlot extends BaseSlot {
  type: FunctionKind;
  async?: boolean;
  arity?: number;
  returnsKind?: NodeKind | NodeKind[];
  exported?: boolean;
  default?: boolean;
}

export type PropertyKind =
  | "PropertyAssignment"
  | "PropertySignature"
  | "PropertyDeclaration";

export interface PropertySlot extends BaseSlot {
  type: PropertyKind;
  valueKind?: NodeKind | NodeKind[];
  optional?: boolean;
  readonly?: boolean;
}

export type LiteralKind = "StringLiteral" | "NumericLiteral";

export interface LiteralSlot extends BaseSlot {
  type: LiteralKind;
  matches?: RegExp;
}

export interface AnySlot extends BaseSlot {
  type: NodeKind | NodeKind[];
}

export type Slot =
  | ImportSlot
  | FunctionSlot
  | PropertySlot
  | LiteralSlot
  | AnySlot;

export interface MatchTemplate {
  id: string;
  body: string;
  slots?: Record<string, Slot>;
}
