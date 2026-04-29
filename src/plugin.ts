import { rule as forbidRule } from "./rules/forbid";
import { rule as matchRule } from "./rules/match";

/**
 * The plugin object: meta + rules.
 * `meta` is read from `package.json` at runtime so the source doesn't carry
 * a hand-maintained `name`/`version` copy that can drift on release. ESLint
 * reads `meta.name` and `meta.version` only; the rest of the json is inert.
 */
export const plugin = {
  meta: require("../package.json") as { name: string; version: string },
  rules: { match: matchRule, forbid: forbidRule },
};
