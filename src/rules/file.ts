import { ESLintUtils } from "@typescript-eslint/utils";
import { matchProgram, type MatchMessageId } from "../matcher/match";
import { parseTemplate, type ParsedTemplate } from "../matcher/parse-template";
import type { FileRuleOptions } from "../types";
import { fileRuleSchema } from "./file.schema";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/TerryTsai/eslint-plugin-templates/blob/main/docs/rules/${name}.md`,
);

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
  unknownVariable:
    'Template "{{templateId}}" references variable "{{name}}" that is not declared in `variables`.',
};

const parsedCache = new WeakMap<object, ParsedTemplate>();

export const rule = createRule<[FileRuleOptions], MatchMessageId>({
  name: "file",
  meta: {
    type: "problem",
    docs: { description: "Enforce that files conform to a declared structural template." },
    schema: fileRuleSchema,
    messages,
  },
  defaultOptions: [{ template: { id: "default", body: "" } }],
  create(context, [{ template }]) {
    let parsed = parsedCache.get(template);
    if (!parsed) {
      parsed = parseTemplate(template.body);
      parsedCache.set(template, parsed);
    }
    return {
      Program(node) {
        const result = matchProgram(parsed, node, template.variables ?? {});
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
