import tsParser from "@typescript-eslint/parser";

import templates from "../../dist/index.js";

export function templateConfig({ files, ignores, template }) {
  return {
    files,
    ...(ignores && { ignores }),
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
    plugins: { templates },
    rules: { "templates/match": ["error", template] },
  };
}
