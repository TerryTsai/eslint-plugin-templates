import { matchProgram, type MatchMessageId } from "../matcher/match";
import { parseTemplate, type ParsedTemplate } from "../matcher/parse-template";
import type { MatchTemplate } from "../types";
import { createRule } from "./_common";
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

const parsedCache = new WeakMap<object, ParsedTemplate>();

function getParsed(template: MatchTemplate): ParsedTemplate {
  let parsed = parsedCache.get(template);
  if (!parsed) parsedCache.set(template, (parsed = parseTemplate(template.body)));
  return parsed;
}

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
