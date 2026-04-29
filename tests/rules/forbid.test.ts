import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { rule } from "../../src/rules/forbid";

RuleTester.afterAll = afterAll;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.describe = describe;

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
});

ruleTester.run("forbid", rule, {
  valid: [],
  invalid: [
    {
      name: "fires on any file with default message",
      code: `const x = 1;`,
      errors: [{ messageId: "forbidden" }],
    },
    {
      name: "fires on an empty file",
      code: ``,
      errors: [{ messageId: "forbidden" }],
    },
    {
      name: "uses a custom message when provided",
      code: `const x = 1;`,
      options: [{ message: "Service folders only contain handlers, types, and index." }],
      errors: [
        {
          messageId: "forbidden",
          data: { message: "Service folders only contain handlers, types, and index." },
        },
      ],
    },
  ],
});
