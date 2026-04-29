import { rule } from "../../src/rules/match";
import { ruleTester } from "../_helpers/ruleTester";

ruleTester.run("match — error messageIds", rule, {
  valid: [],
  invalid: [
    {
      name: "extra content after the template ends",
      code: `function hello() {}\nconst leftover = 1;`,
      options: [
        {
          id: "feature",
          body: "{{FUNCTIONS}}",
          slots: { FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 } },
        },
      ],
      errors: [{ messageId: "extraContent" }],
    },
    {
      name: "placeholder without a matching slot definition",
      code: `function hello() {}`,
      options: [{ id: "feature", body: "{{MISSING}}" }],
      errors: [{ messageId: "unknownSlot", data: { name: "MISSING", templateId: "feature" } }],
    },
    {
      name: "named refinement: function name does not match regex",
      code: `function destroyWidget() {}`,
      options: [
        {
          id: "feature",
          body: "{{FN}}",
          slots: { FN: { type: "FunctionDeclaration", named: /^create/ } },
        },
      ],
      errors: [{ messageId: "refinementFailed" }],
    },
    {
      name: "fromPath refinement: import is from wrong package",
      code: `import { foo } from "vue";`,
      options: [
        {
          id: "feature",
          body: "{{REACT}}",
          slots: { REACT: { type: "ImportDeclaration", fromPath: "react" } },
        },
      ],
      errors: [{ messageId: "refinementFailed" }],
    },
  ],
});
