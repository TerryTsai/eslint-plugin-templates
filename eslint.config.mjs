import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

import { layoutConfig, matchConfig } from "./dist/index.js";
import { barrelTemplate } from "./eslint/barrelTemplate.mjs";
import { constantTemplate } from "./eslint/constantTemplate.mjs";
import { entryTemplate } from "./eslint/entryTemplate.mjs";
import { eslintConfigTemplate } from "./eslint/eslintConfigTemplate.mjs";
import { moduleTemplate } from "./eslint/moduleTemplate.mjs";
import { typesTemplate } from "./eslint/typesTemplate.mjs";

const tsLanguageOptions = { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } };

export default [
  { ignores: ["dist/**", "node_modules/**", "tests/**/fixtures/**"] },

  {
    files: ["**/*.ts"],
    languageOptions: tsLanguageOptions,
    plugins: { "@typescript-eslint": tsPlugin, import: importPlugin },
    settings: { "import/resolver": { typescript: { project: "./tsconfig.json" } } },
    rules: {
      "max-len": ["error", { code: 140, ignoreUrls: true, ignoreRegExpLiterals: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
      "max-lines": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 20, skipBlankLines: true, skipComments: true }],
      "max-depth": ["error", 2],
      "complexity": ["error", 6],
      "prefer-const": "error",
      "prefer-template": "error",
      "eqeqeq": ["error", "always"],
      "no-console": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "brace-style": ["error", "1tbs", { allowSingleLine: false }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "import/order": ["error", { groups: ["builtin", "external", "internal", "parent", "sibling", "index"], "newlines-between": "always", alphabetize: { order: "asc", caseInsensitive: true } }],
      "import/no-cycle": "error",
    },
  },

  {
    files: ["tests/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },

  matchConfig({
    files: "eslint.config.mjs",
    template: eslintConfigTemplate,
    languageOptions: tsLanguageOptions,
  }),

  ...layoutConfig({
    root: "eslint",
    languageOptions: tsLanguageOptions,
    layout: { closed: {}, content: { "*.mjs": constantTemplate } },
  }),

  ...layoutConfig({
    root: "src",
    languageOptions: tsLanguageOptions,
    layout: {
      closed: { message: "src/ shape is locked. Adjust a template or restructure the file to match." },
      content: {
        "index.ts": entryTemplate,
        "compile.ts": moduleTemplate,
        "matcher.ts": barrelTemplate,
        "layout.ts": barrelTemplate,
        "config.ts": barrelTemplate,
        "plugin.ts": constantTemplate,
        "match/": {
          content: {
            "types.ts": typesTemplate,
            "*.ts": moduleTemplate,
          },
        },
      },
    },
  }),
];
