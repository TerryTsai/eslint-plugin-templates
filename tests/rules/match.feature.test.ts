import { rule } from "../../src/rules/match";
import type { MatchTemplate } from "../../src/types";
import { ruleTester } from "../_helpers/ruleTester";

const featureTemplate: MatchTemplate = {
  id: "feature",
  body: `
    {{IMPORTS}}
    {{FUNCTIONS}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
    FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
  },
};

ruleTester.run("match — feature shape", rule, {
  valid: [
    {
      name: "imports + functions in declared order",
      code: `import { a } from "a";\nimport { b } from "b";\nfunction hello() {}\nfunction goodbye() {}`,
      options: [featureTemplate],
    },
    {
      name: "no imports allowed when IMPORTS is minOccurs:0",
      code: `function hello() {}`,
      options: [featureTemplate],
    },
  ],
  invalid: [
    {
      name: "missing required functions reports missingRequired",
      code: `import { a } from "a";`,
      options: [featureTemplate],
      errors: [{ messageId: "missingRequired" }],
    },
    {
      name: "forbidden top-level node breaks the sequence",
      code: `import { a } from "a";\nconst x = 1;\nfunction hello() {}`,
      options: [featureTemplate],
      errors: [{ messageId: "missingRequired" }],
    },
    {
      name: "missing kind entirely still reports missingRequired",
      code: ``,
      options: [featureTemplate],
      errors: [{ messageId: "missingRequired" }],
    },
  ],
});
