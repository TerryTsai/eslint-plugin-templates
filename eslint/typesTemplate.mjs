import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

/** Types-only module: imports plus named exports of types or brand constants. */
export const typesTemplate = {
  name: "types",
  match: compile(`
    {{IMPORTS}}
    {{BODY}}
  `, {
    IMPORTS: { min: 0, max: 3,  match: { type: "ImportDeclaration" } },
    BODY:    { min: 1, max: 10, match: { type: "ExportNamedDeclaration" } },
  }, parse),
};
