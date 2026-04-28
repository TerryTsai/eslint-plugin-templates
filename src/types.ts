export type NodeKind = string;

export type Severity = "error" | "warning" | "info";

export type NamedConstraint = string | RegExp;

export interface Template {
  body?: string;
  variables?: Record<string, Variable>;
}

export interface BaseVariable extends Template {
  minOccurs?: number;
  maxOccurs?: number;
  named?: NamedConstraint;
}

export interface ImportVariable extends BaseVariable {
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

export interface FunctionVariable extends BaseVariable {
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

export interface PropertyVariable extends BaseVariable {
  type: PropertyKind;
  valueKind?: NodeKind | NodeKind[];
  optional?: boolean;
  readonly?: boolean;
}

export type LiteralKind = "StringLiteral" | "NumericLiteral";

export interface LiteralVariable extends BaseVariable {
  type: LiteralKind;
  matches?: RegExp;
}

export interface AnyVariable extends BaseVariable {
  type: NodeKind | NodeKind[];
}

export type Variable =
  | ImportVariable
  | FunctionVariable
  | PropertyVariable
  | LiteralVariable
  | AnyVariable;

export interface FileTemplate extends Template {
  id: string;
  body: string;
  description?: string;
  message?: string;
  severity?: Severity;
}

export interface FileRuleOptions {
  template: FileTemplate;
}
