import { type TSESLint } from "@typescript-eslint/utils";

import { matchNode } from "./match/matchNode";
import { type NodeMatcher } from "./match/types";

const match: TSESLint.RuleModule<"divergence", [NodeMatcher]> = {
  meta: {
    type: "problem",
    docs: { description: "Enforce that files match a declared template." },
    schema: [{ type: "object" }],
    messages: { divergence: 'File diverges from template{{namePart}}: {{reason}}{{pathPart}}.' },
  },
  create(ctx) {
    const template = ctx.options[0] ?? { match: {} };
    return {
      Program(node) {
        const result = matchNode(template, node, new Map());
        if (result.ok) return;
        const namePart = template.name ? ` "${template.name}"` : "";
        const pathPart = result.path && result.path.length ? ` at ${result.path.join(".")}` : "";
        ctx.report({ node, messageId: "divergence", data: { namePart, pathPart, reason: result.reason } });
      },
    };
  },
};

const forbid: TSESLint.RuleModule<"forbidden", [{ message?: string }]> = {
  meta: {
    type: "problem",
    docs: { description: "Reject every file matched by this rule's `files` glob." },
    schema: [{ type: "object", properties: { message: { type: "string" } }, additionalProperties: false }],
    messages: { forbidden: "{{message}}" },
  },
  create(ctx) {
    const message = ctx.options[0]?.message ?? "This file is not allowed in the current scope.";
    return {
      Program(node) {
        ctx.report({ node, messageId: "forbidden", data: { message } });
      },
    };
  },
};

/** Plugin entry — meta read from `package.json` to keep `name`/`version` in sync. */
export const plugin = {
  meta: require("../package.json") as { name: string; version: string },
  rules: { match, forbid },
};
