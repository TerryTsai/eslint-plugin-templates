import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { rule } from "../../src/rules/file";
import type { FileTemplate } from "../../src/types";

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

const featureTemplate: FileTemplate = {
  id: "feature",
  body: "${IMPORTS}\n${FUNCTIONS}",
  variables: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
    FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
  },
};

ruleTester.run("file", rule, {
  valid: [
    {
      name: "imports + functions in declared order",
      code: `import { a } from "a";\nimport { b } from "b";\nfunction hello() {}\nfunction goodbye() {}`,
      options: [{ template: featureTemplate }],
    },
    {
      name: "no imports allowed when IMPORTS is minOccurs:0",
      code: `function hello() {}`,
      options: [{ template: featureTemplate }],
    },
  ],
  invalid: [
    {
      name: "missing required functions reports missingRequired",
      code: `import { a } from "a";`,
      options: [{ template: featureTemplate }],
      errors: [{ messageId: "missingRequired" }],
    },
    {
      name: "forbidden top-level node breaks the sequence",
      code: `import { a } from "a";\nconst x = 1;\nfunction hello() {}`,
      options: [{ template: featureTemplate }],
      errors: [{ messageId: "missingRequired" }],
    },
    {
      name: "extra content after the template ends",
      code: `function hello() {}\nconst leftover = 1;`,
      options: [
        {
          template: {
            id: "feature",
            body: "${FUNCTIONS}",
            variables: { FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 } },
          },
        },
      ],
      errors: [{ messageId: "extraContent" }],
    },
    {
      name: "placeholder without a matching variable definition",
      code: `function hello() {}`,
      options: [{ template: { id: "feature", body: "${MISSING}" } }],
      errors: [{ messageId: "unknownVariable", data: { name: "MISSING", templateId: "feature" } }],
    },
    {
      name: "named refinement: function name does not match regex",
      code: `function destroyWidget() {}`,
      options: [
        {
          template: {
            id: "feature",
            body: "${FN}",
            variables: { FN: { type: "FunctionDeclaration", named: /^create/ } },
          },
        },
      ],
      errors: [{ messageId: "refinementFailed" }],
    },
    {
      name: "fromPath refinement: import is from wrong package",
      code: `import { foo } from "vue";`,
      options: [
        {
          template: {
            id: "feature",
            body: "${REACT}",
            variables: { REACT: { type: "ImportDeclaration", fromPath: "react" } },
          },
        },
      ],
      errors: [{ messageId: "refinementFailed" }],
    },
    {
      name: "missing kind entirely still reports missingRequired (no refinement to blame)",
      code: ``,
      options: [{ template: featureTemplate }],
      errors: [{ messageId: "missingRequired" }],
    },
    {
      name: "binding mismatch when an inline placeholder differs across positions",
      code: `function helloWorld() {}\nexport { goodbye };`,
      options: [
        {
          template: {
            id: "feature",
            body: "function ${NAME}() {}\nexport { ${NAME} };",
          },
        },
      ],
      errors: [{ messageId: "bindingMismatch" }],
    },
  ],
});
