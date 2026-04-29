import { createRule } from "./createRule";
import { forbidRuleSchema } from "./forbid.schema";

export type ForbidMessageId = "forbidden";

export interface ForbidOptions {
  message?: string;
}

const DEFAULT_MESSAGE = "This file is not allowed in the current scope.";

const messages: Record<ForbidMessageId, string> = {
  forbidden: "{{message}}",
};

export const rule = createRule<[ForbidOptions], ForbidMessageId>({
  name: "forbid",
  meta: {
    type: "problem",
    docs: { description: "Reject every file matched by this rule's `files` glob." },
    schema: forbidRuleSchema,
    messages,
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const message = options.message ?? DEFAULT_MESSAGE;
    return {
      Program(node) {
        context.report({ node, messageId: "forbidden", data: { message } });
      },
    };
  },
});
