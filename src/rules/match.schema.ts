import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

const SPECIALIZED_KINDS = [
  "ImportDeclaration",
  "FunctionDeclaration",
  "ArrowFunction",
  "FunctionExpression",
  "MethodDeclaration",
  "MethodSignature",
  "PropertyAssignment",
  "PropertySignature",
  "PropertyDeclaration",
  "StringLiteral",
  "NumericLiteral",
];

const NAMED: JSONSchema4 = { oneOf: [{ type: "string" }, { type: "object" }] };
const NODE_KIND: JSONSchema4 = {
  oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
};

const baseProperties: Record<string, JSONSchema4> = {
  minOccurs: { type: "integer", minimum: 0 },
  maxOccurs: { type: "integer", minimum: 1 },
  named: NAMED,
};

const stringEnum = (...values: string[]): JSONSchema4 => ({ type: "string", enum: values });

/**
 * Build a slot-variant schema by merging the variant's specific fields with the shared base.
 * `additionalProperties: false` means cross-variant refinements (e.g. `arity` on an ImportSlot)
 * are rejected at config-load time.
 */
const variant = (specific: Record<string, JSONSchema4>): JSONSchema4 => ({
  type: "object",
  properties: { ...baseProperties, ...specific },
  required: ["type"],
  additionalProperties: false,
});

const importSlot = variant({
  type: stringEnum("ImportDeclaration"),
  typeOnly: { type: "boolean" },
  fromPath: { type: "string" },
});

const functionSlot = variant({
  type: stringEnum(
    "FunctionDeclaration",
    "ArrowFunction",
    "FunctionExpression",
    "MethodDeclaration",
    "MethodSignature",
  ),
  async: { type: "boolean" },
  arity: { type: "integer", minimum: 0 },
  returnsKind: NODE_KIND,
  exported: { type: "boolean" },
  default: { type: "boolean" },
});

const propertySlot = variant({
  type: stringEnum("PropertyAssignment", "PropertySignature", "PropertyDeclaration"),
  valueKind: NODE_KIND,
  optional: { type: "boolean" },
  readonly: { type: "boolean" },
});

const literalSlot = variant({
  type: stringEnum("StringLiteral", "NumericLiteral"),
  matches: { type: "object" },
});

const anySlot = variant({
  type: {
    oneOf: [
      { type: "string", not: { type: "string", enum: SPECIALIZED_KINDS } },
      { type: "array", items: { type: "string" } },
    ],
  },
});

const slot: JSONSchema4 = {
  oneOf: [importSlot, functionSlot, propertySlot, literalSlot, anySlot],
};

/**
 * JSON Schema for the `templates/match` rule's options.
 * Validated by ESLint at config-load time, so misconfigured templates fail
 * before any file is linted.
 */
export const matchRuleSchema: JSONSchema4[] = [
  {
    type: "object",
    properties: {
      id: { type: "string" },
      body: { type: "string" },
      slots: { type: "object", additionalProperties: slot },
    },
    required: ["id", "body"],
    additionalProperties: false,
  },
];
