import { rule as forbidRule } from "./rules/forbid";
import { rule as matchRule } from "./rules/match";

const plugin = {
  meta: { name: "eslint-plugin-templates", version: "0.1.1" },
  rules: { match: matchRule, forbid: forbidRule },
};

export = plugin;
