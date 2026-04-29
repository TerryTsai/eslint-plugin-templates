import { ESLintUtils } from "@typescript-eslint/utils";

/**
 * Rule factory that links each rule to its docs page on GitHub.
 * Used by both `match` and `forbid`.
 */
export const createRule = ESLintUtils.RuleCreator((name) => `https://github.com/TerryTsai/eslint-plugin-templates/blob/main/docs/rules/${name}.md`);
