import { standardConfig } from "./eslint/builders/standardConfig.mjs";
import { templateConfig } from "./eslint/builders/templateConfig.mjs";
import { ignores } from "./eslint/ignores.mjs";
import { testOverrides } from "./eslint/rules/testOverrides.mjs";
import { builderModuleTemplate } from "./eslint/templates/builderModuleTemplate.mjs";
import { constantModuleTemplate } from "./eslint/templates/constantModuleTemplate.mjs";
import { leafCheckTemplate } from "./eslint/templates/leafCheckTemplate.mjs";
import { matcherTemplate } from "./eslint/templates/matcherTemplate.mjs";
import { ruleFileTemplate } from "./eslint/templates/ruleFileTemplate.mjs";
import { schemaFileTemplate } from "./eslint/templates/schemaFileTemplate.mjs";
import { typesModuleTemplate } from "./eslint/templates/typesModuleTemplate.mjs";

const TYPES_ONLY_FILES = ["src/types.ts", "src/matcher/sequence/matchResult.ts"];

export default [
  { ignores },
  standardConfig({ files: ["src/**/*.ts"] }),
  templateConfig({ files: ["src/matcher/**/*.ts"], ignores: ["src/matcher/refinements/checks/**", ...TYPES_ONLY_FILES], template: matcherTemplate }),
  templateConfig({ files: ["src/matcher/refinements/checks/*.ts"], template: leafCheckTemplate }),
  templateConfig({ files: TYPES_ONLY_FILES, template: typesModuleTemplate }),
  templateConfig({ files: ["src/rules/createRule.ts"], template: constantModuleTemplate }),
  templateConfig({ files: ["src/rules/match.ts", "src/rules/forbid.ts"], template: ruleFileTemplate }),
  templateConfig({ files: ["src/rules/*.schema.ts"], template: schemaFileTemplate }),
  templateConfig({ files: ["eslint/templates/*.mjs", "eslint/rules/*.mjs", "eslint/ignores.mjs"], template: constantModuleTemplate }),
  templateConfig({ files: ["eslint/builders/*.mjs"], template: builderModuleTemplate }),
  standardConfig({ files: ["tests/**/*.ts"], overrides: testOverrides }),
];
