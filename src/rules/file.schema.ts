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
  body: { type: "string" },
  variables: { type: "object" },
};

const stringEnum = (...values: string[]): JSONSchema4 => ({ type: "string", enum: values });

const variant = (specific: Record<string, JSONSchema4>): JSONSchema4 => ({
  type: "object",
  properties: { ...baseProperties, ...specific },
  required: ["type"],
  additionalProperties: false,
});

const importVariable = variant({
  type: stringEnum("ImportDeclaration"),
  typeOnly: { type: "boolean" },
  fromPath: { type: "string" },
});

const functionVariable = variant({
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

const propertyVariable = variant({
  type: stringEnum("PropertyAssignment", "PropertySignature", "PropertyDeclaration"),
  valueKind: NODE_KIND,
  optional: { type: "boolean" },
  readonly: { type: "boolean" },
});

const literalVariable = variant({
  type: stringEnum("StringLiteral", "NumericLiteral"),
  matches: { type: "object" },
});

const anyVariable = variant({
  type: {
    oneOf: [
      { type: "string", not: { type: "string", enum: SPECIALIZED_KINDS } },
      { type: "array", items: { type: "string" } },
    ],
  },
});

const variable: JSONSchema4 = {
  oneOf: [importVariable, functionVariable, propertyVariable, literalVariable, anyVariable],
};

export const fileRuleSchema: JSONSchema4[] = [
  {
    type: "object",
    properties: {
      template: {
        type: "object",
        properties: {
          id: { type: "string" },
          body: { type: "string" },
          description: { type: "string" },
          message: { type: "string" },
          severity: stringEnum("error", "warning", "info"),
          variables: { type: "object", additionalProperties: variable },
        },
        required: ["id", "body"],
        additionalProperties: false,
      },
    },
    required: ["template"],
    additionalProperties: false,
  },
];
