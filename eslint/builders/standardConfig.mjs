import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";

import { sharedRules } from "../rules/sharedRules.mjs";

export function standardConfig({ files, overrides = {} }) {
  return {
    files,
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
    plugins: { "@typescript-eslint": tsPlugin, import: importPlugin },
    settings: { "import/resolver": { typescript: { project: "./tsconfig.json" } } },
    rules: { ...sharedRules, ...overrides },
  };
}
