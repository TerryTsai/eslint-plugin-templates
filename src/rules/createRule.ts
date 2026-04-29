import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/TerryTsai/eslint-plugin-templates/blob/main/docs/rules/${name}.md`);
