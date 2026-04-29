import { rule as forbidRule } from "./rules/forbid";
import { rule as matchRule } from "./rules/match";

/**
 * The plugin object: meta + rules.
 * Exported here so both the CJS entry (src/index.ts) and the config helpers
 * can reference it without duplicating the wiring.
 */
export const plugin = {
  meta: { name: "eslint-plugin-templates", version: "0.2.1" },
  rules: { match: matchRule, forbid: forbidRule },
};
