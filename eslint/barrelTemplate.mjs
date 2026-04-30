import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const HELPER_KINDS = ["VariableDeclaration", "FunctionDeclaration", "TSTypeAliasDeclaration", "TSInterfaceDeclaration"];

/**
 * Barrel-style module: imports, one or more named exports, optional trailing
 * helpers.
 */
export const barrelTemplate = {
  name: "barrel",
  match: compile(`
    {{IMPORTS}}
    {{EXPORTS}}
    {{HELPERS}}
  `, {
    IMPORTS: { min: 0, max: 5,  match: { type: "ImportDeclaration" } },
    EXPORTS: { min: 1, max: 5,  match: { type: "ExportNamedDeclaration" } },
    HELPERS: { min: 0, max: 5,  match: { type: HELPER_KINDS } },
  }, parse),
};
