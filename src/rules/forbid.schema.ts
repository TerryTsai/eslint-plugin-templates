import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

/** JSON Schema for the `templates/forbid` rule's options. */
export const forbidRuleSchema: JSONSchema4[] = [
  {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    additionalProperties: false,
  },
];
