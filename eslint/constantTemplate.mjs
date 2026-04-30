import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const SETUP_KINDS = ["VariableDeclaration", "FunctionDeclaration", "TSTypeAliasDeclaration", "TSInterfaceDeclaration"];

/**
 * Files that export a single const: imports, optional setup, and exactly one
 * named export of a `VariableDeclaration`.
 */
export const constantTemplate = {
  name: "constant",
  match: compile(`
    {{IMPORTS}}
    {{SETUP}}
    {{EXPORTED}}
  `, {
    IMPORTS:  { min: 0, max: 5, match: { type: "ImportDeclaration" } },
    SETUP:    { min: 0, max: 5, match: { type: SETUP_KINDS } },
    EXPORTED: { min: 1, max: 1, match: {
      type: "ExportNamedDeclaration",
      declaration: { match: { type: "VariableDeclaration" } },
    } },
  }, parse),
};
