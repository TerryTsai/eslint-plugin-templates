import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const SETUP_KINDS = ["VariableDeclaration", "FunctionDeclaration", "TSTypeAliasDeclaration", "TSInterfaceDeclaration"];
const HELPER_KINDS = ["VariableDeclaration", "FunctionDeclaration", "TSTypeAliasDeclaration", "TSInterfaceDeclaration"];

/**
 * Default file shape: imports, optional setup, exactly one named export,
 * optional trailing helpers.
 */
export const moduleTemplate = {
  name: "module",
  match: compile(`
    {{IMPORTS}}
    {{SETUP}}
    {{EXPORTED}}
    {{HELPERS}}
  `, {
    IMPORTS:  { min: 0, max: 5,  match: { type: "ImportDeclaration" } },
    SETUP:    { min: 0, max: 5,  match: { type: SETUP_KINDS } },
    EXPORTED: { min: 1, max: 1,  match: { type: "ExportNamedDeclaration" } },
    HELPERS:  { min: 0, max: 10, match: { type: HELPER_KINDS } },
  }, parse),
};
