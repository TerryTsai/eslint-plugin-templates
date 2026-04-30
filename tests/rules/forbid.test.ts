import { plugin } from "../../src/plugin";
import { ruleTester } from "../helpers/ruleTester";

ruleTester.run("forbid", plugin.rules.forbid, {
  valid: [],
  invalid: [
    { code: `let x = 1;`, options: [{}], errors: [{ messageId: "forbidden" }] },
    {
      code: `export const a = 1;`,
      options: [{ message: "no extras here" }],
      errors: [{ messageId: "forbidden", data: { message: "no extras here" } }],
    },
  ],
});
