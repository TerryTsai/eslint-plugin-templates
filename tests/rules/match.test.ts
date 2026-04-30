import * as parser from "@typescript-eslint/parser";

import { compile } from "../../src/compile";
import { plugin } from "../../src/plugin";
import { ruleTester } from "../helpers/ruleTester";

const parse = (src: string): unknown =>
  parser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const handler = {
  name: "handler",
  match: compile(`
    {{IMPORTS}}
    {{HANDLER}}
  `, {
    IMPORTS: { min: 0, max: 5, match: { type: "ImportDeclaration" } },
    HANDLER: { match: { type: "FunctionDeclaration" } },
  }, parse),
};

ruleTester.run("match", plugin.rules.match, {
  valid: [
    { code: `import x from "y";\nfunction h() {}`, options: [handler] },
    { code: `function h() {}`, options: [handler] },
  ],
  invalid: [
    {
      code: `function h() {}\nclass X {}`,
      options: [handler],
      errors: [{ messageId: "divergence" }],
    },
  ],
});
