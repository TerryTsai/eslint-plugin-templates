import type { JSONSchema4 } from "@typescript-eslint/utils/json-schema";

export const forbidRuleSchema: JSONSchema4[] = [
  {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    additionalProperties: false,
  },
];
