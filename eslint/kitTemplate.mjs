import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const BODY_KINDS = [
  "ExportNamedDeclaration",
  "VariableDeclaration", "FunctionDeclaration",
  "TSTypeAliasDeclaration", "TSInterfaceDeclaration",
];

/**
 * Helper kit: imports plus a body of many named exports interleaved with
 * file-local helpers. Used for parser-specific matcher conveniences.
 */
export const kitTemplate = {
  name: "kit",
  match: compile(`
    {{IMPORTS}}
    {{BODY}}
  `, {
    IMPORTS: { min: 0, max: 5,  match: { type: "ImportDeclaration" } },
    BODY:    { min: 1, max: 60, match: { type: BODY_KINDS } },
  }, parse),
};
