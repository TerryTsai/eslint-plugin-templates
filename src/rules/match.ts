import { matchProgram } from "../matcher/matchProgram";
import { type MatchMessageId } from "../matcher/matchResult";
import { parseTemplate, type ParsedTemplate } from "../parsing/parseTemplate";
import { type MatchTemplate } from "../types";

import { createRule } from "./createRule";
import { matchRuleSchema } from "./match.schema";

const messages: Record<MatchMessageId, string> = {
  divergence:
    'File diverges from template "{{templateId}}": expected {{expected}} at this position, found {{found}}.',
  missingRequired:
    'File diverges from template "{{templateId}}": expected at least {{minOccurs}} {{type}} node(s) for "{{name}}", found {{found}}.',
  refinementFailed:
    'File diverges from template "{{templateId}}": "{{name}}" expects {{type}} matching refinement "{{refinement}}".',
  bindingMismatch:
    'File diverges from template "{{templateId}}": "{{name}}" was bound to "{{bound}}" earlier but found "{{got}}" here.',
  extraContent:
    'File diverges from template "{{templateId}}": unexpected {{found}} after the last template position.',
  unknownSlot:
    'Template "{{templateId}}" references slot "{{name}}" that is not declared in `slots`.',
};

const parsedCache = new WeakMap<MatchTemplate, ParsedTemplate>();

/**
 * Parse the template body once per template object.
 * ESLint reuses the same options object across files, so caching avoids
 * reparsing for every file in the run.
 */
function getParsed(template: MatchTemplate): ParsedTemplate {
  const cached = parsedCache.get(template);
  if (cached) return cached;
  const fresh = parseTemplate(template.body);
  parsedCache.set(template, fresh);
  return fresh;
}

/**
 * `templates/match` rule: for each file, parse the template body (once, cached),
 * match the file's program against it, and report the first divergence as a diagnostic.
 */
export const rule = createRule<[MatchTemplate], MatchMessageId>({
  name: "match",
  meta: {
    type: "problem",
    docs: { description: "Enforce that files match a declared template." },
    schema: matchRuleSchema,
    messages,
  },
  defaultOptions: [{ id: "default", body: "" }],
  create(context, [template]) {
    const parsed = getParsed(template);
    return {
      Program(node) {
        const result = matchProgram(parsed, node, template.slots ?? {});
        if (result.ok) return;
        const { messageId, data, node: errorNode } = result.error;
        context.report({
          node: errorNode,
          messageId,
          data: { ...data, templateId: template.id },
        });
      },
    };
  },
});
