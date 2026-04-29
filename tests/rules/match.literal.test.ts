import { rule } from "../../src/rules/match";
import type { MatchTemplate } from "../../src/types";
import { ruleTester } from "../_helpers/ruleTester";

const literalTemplate: MatchTemplate = {
  id: "feature",
  body: `
    import { useState } from "react";
    {{HOOKS}}
  `,
  slots: { HOOKS: { type: "FunctionDeclaration", minOccurs: 1, maxOccurs: 5 } },
};

ruleTester.run("match — literal text in body", rule, {
  valid: [
    {
      name: "literal import followed by hook functions",
      code: `import { useState } from "react";\nfunction useThing() {}\nfunction useOther() {}`,
      options: [literalTemplate],
    },
    {
      name: "literal shell with an inline placeholder for the function name",
      code: `export function widget() { return null; }`,
      options: [{ id: "feature", body: "export function {{NAME}}() { return null; }" }],
    },
  ],
  invalid: [
    {
      name: "binding mismatch when inline placeholder differs across positions",
      code: `function helloWorld() {}\nexport { goodbye };`,
      options: [
        {
          id: "feature",
          body: `
            function {{NAME}}() {}
            export { {{NAME}} };
          `,
        },
      ],
      errors: [{ messageId: "bindingMismatch" }],
    },
    {
      name: "literal portion of body must match exactly",
      code: `import { useEffect } from "react";\nfunction useThing() {}`,
      options: [
        {
          id: "feature",
          body: `
            import { useState } from "react";
            {{HOOKS}}
          `,
          slots: { HOOKS: { type: "FunctionDeclaration", minOccurs: 1 } },
        },
      ],
      errors: [{ messageId: "divergence" }],
    },
  ],
});
