import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

import { applyModule, defineModule } from "./dist/config/index.js";
import templates from "./dist/index.js";
import { barrelTemplate } from "./eslint/barrelTemplate.mjs";
import { constantTemplate } from "./eslint/constantTemplate.mjs";
import { entryTemplate } from "./eslint/entryTemplate.mjs";
import { eslintConfigTemplate } from "./eslint/eslintConfigTemplate.mjs";
import { leafCheckTemplate } from "./eslint/leafCheckTemplate.mjs";
import { leanTemplate } from "./eslint/leanTemplate.mjs";
import { moduleTemplate } from "./eslint/moduleTemplate.mjs";
import { ruleTemplate } from "./eslint/ruleTemplate.mjs";
import { schemaTemplate } from "./eslint/schemaTemplate.mjs";
import { typesTemplate } from "./eslint/typesTemplate.mjs";

export default [
  // ignored paths
  { ignores: ["dist/**", "node_modules/**", "tests/**/fixtures/**"] },

  // shared rules across source, tests, and config
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
    plugins: { "@typescript-eslint": tsPlugin, import: importPlugin },
    settings: { "import/resolver": { typescript: { project: "./tsconfig.json" } } },
    rules: {
      // line and file size
      "max-len": ["error", { code: 140, ignoreUrls: true, ignoreRegExpLiterals: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
      "max-lines": ["error", { max: 100, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", { max: 20, skipBlankLines: true, skipComments: true }],

      // control flow
      "max-depth": ["error", 2],
      "complexity": ["error", 6],

      // language style
      "prefer-const": "error",
      "prefer-template": "error",
      "eqeqeq": ["error", "always"],
      "no-console": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "brace-style": ["error", "1tbs", { allowSingleLine: false }],

      // typescript
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],

      // imports
      "import/order": ["error", { groups: ["builtin", "external", "internal", "parent", "sibling", "index"], "newlines-between": "always", alphabetize: { order: "asc", caseInsensitive: true } }],
      "import/no-cycle": "error",
    },
  },

  // shape of this config file
  {
    files: ["eslint.config.mjs"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
    plugins: { templates },
    rules: { "templates/match": ["error", eslintConfigTemplate] },
  },

  // eslint folder shape
  ...applyModule({
    root: "eslint",
    parser: tsParser,
    module: defineModule({
      closed: true,
      contents: { "*.mjs": constantTemplate },
    }),
  }),

  // src tree shape
  ...applyModule({
    root: "src",
    parser: tsParser,
    module: defineModule({
      closed: { message: "src/ shape is locked. Adjust a template or restructure the file to match." },
      contents: {
        "index.ts": entryTemplate,
        "types.ts": typesTemplate,
        "plugin.ts": constantTemplate,
        "parsing/": {
          "parseTemplate.ts": leanTemplate,
          "getStatementPlaceholder.ts": leanTemplate,
          "placeholderName.ts": leanTemplate,
        },
        "matcher/": {
          "matchProgram.ts": leanTemplate,
          "matchResult.ts": typesTemplate,
          "kinds/": {
            "describeKind.ts": leanTemplate,
            "unwrap.ts": leanTemplate,
            "getName.ts": moduleTemplate,
            "nodeMatchesKind.ts": moduleTemplate,
          },
          "refinements/": {
            "applyRefinements.ts": moduleTemplate,
            "checks/": { "*.ts": leafCheckTemplate },
          },
          "sequence/": {
            "bindingContext.ts": leanTemplate,
            "cardinalityOf.ts": leanTemplate,
            "fail.ts": leanTemplate,
            "consumePlaceholder.ts": moduleTemplate,
            "matchSequence.ts": moduleTemplate,
            "structurallyEqual.ts": moduleTemplate,
          },
        },
        "rules/": {
          "createRule.ts": constantTemplate,
          "match.ts": ruleTemplate,
          "forbid.ts": ruleTemplate,
          "*.schema.ts": schemaTemplate,
        },
        "config/": {
          "applyModule.ts": moduleTemplate,
          "defineModule.ts": moduleTemplate,
          "types.ts": typesTemplate,
          "index.ts": barrelTemplate,
          "internal/": {
            "brand.ts": constantTemplate,
            "specificity.ts": moduleTemplate,
            "validateTree.ts": moduleTemplate,
          },
        },
      },
    }),
  }),
];
