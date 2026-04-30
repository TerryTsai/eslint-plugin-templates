import tsParser from "@typescript-eslint/parser";

import { compile } from "../dist/index.js";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

/** Package entry: imports, named re-exports, exactly one default export. */
export const entryTemplate = {
  name: "entry",
  match: compile(`
    {{IMPORTS}}
    {{REEXPORTS}}
    {{DEFAULT}}
  `, {
    IMPORTS:   { min: 1, max: 5,  match: { type: "ImportDeclaration" } },
    REEXPORTS: { min: 0, max: 10, match: { type: "ExportNamedDeclaration" } },
    DEFAULT:   { min: 1, max: 1,  match: { type: "ExportDefaultDeclaration" } },
  }, parse),
};
