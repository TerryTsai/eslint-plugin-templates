import tsParser from "@typescript-eslint/parser";

import { applyModule, defineModule } from "./dist/config/index.js";
import { standardConfig } from "./eslint/builders/standardConfig.mjs";
import { ignores } from "./eslint/ignores.mjs";
import { testOverrides } from "./eslint/rules/testOverrides.mjs";
import { builderModuleTemplate } from "./eslint/templates/builderModuleTemplate.mjs";
import { constantModuleTemplate } from "./eslint/templates/constantModuleTemplate.mjs";
import { leafCheckTemplate } from "./eslint/templates/leafCheckTemplate.mjs";
import { matcherTemplate } from "./eslint/templates/matcherTemplate.mjs";
import { ruleFileTemplate } from "./eslint/templates/ruleFileTemplate.mjs";
import { schemaFileTemplate } from "./eslint/templates/schemaFileTemplate.mjs";
import { typesModuleTemplate } from "./eslint/templates/typesModuleTemplate.mjs";

const srcModule = defineModule({
  contents: {
    "types.ts": typesModuleTemplate,
    "plugin.ts": constantModuleTemplate,
    "parsing/": { "*.ts": matcherTemplate },
    "matcher/": {
      "*.ts": matcherTemplate,
      "matchResult.ts": typesModuleTemplate,
      "kinds/": { "*.ts": matcherTemplate },
      "refinements/": {
        "applyRefinements.ts": matcherTemplate,
        "checks/": { "*.ts": leafCheckTemplate },
      },
      "sequence/": { "*.ts": matcherTemplate },
    },
    "rules/": {
      "createRule.ts": constantModuleTemplate,
      "match.ts": ruleFileTemplate,
      "forbid.ts": ruleFileTemplate,
      "*.schema.ts": schemaFileTemplate,
    },
    "config/": {
      "applyModule.ts": matcherTemplate,
      "defineModule.ts": matcherTemplate,
      "specificity.ts": matcherTemplate,
      "validateTree.ts": matcherTemplate,
      "types.ts": typesModuleTemplate,
    },
  },
});

const eslintModule = defineModule({
  contents: {
    "ignores.mjs": constantModuleTemplate,
    "templates/": { "*.mjs": constantModuleTemplate },
    "rules/": { "*.mjs": constantModuleTemplate },
    "builders/": { "*.mjs": builderModuleTemplate },
  },
});

export default [
  { ignores },
  standardConfig({ files: ["src/**/*.ts"] }),
  ...applyModule({ module: srcModule, root: "src", parser: tsParser }),
  ...applyModule({ module: eslintModule, root: "eslint", parser: tsParser }),
  standardConfig({ files: ["tests/**/*.ts"], overrides: testOverrides }),
];
