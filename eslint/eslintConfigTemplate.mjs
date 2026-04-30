import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

/** `eslint.config.mjs` shape: imports, optional setup, one default export array. */
export const eslintConfigTemplate = {
  name: "eslint-config",
  match: compile(`
    {{IMPORTS}}
    {{SETUP}}
    {{EXPORT}}
  `, {
    IMPORTS: { min: 1, max: 15, match: { type: "ImportDeclaration" } },
    SETUP:   { min: 0, max: 3,  match: { type: "VariableDeclaration" } },
    EXPORT:  { min: 1, max: 1,  match: { type: "ExportDefaultDeclaration" } },
  }, parse),
};
