import { plugin } from "./plugin";

export { compile } from "./compile";
export { forbidConfig, layoutConfig, matchConfig } from "./config";
export { bind, matcher, regex } from "./matcher";

export type {
  Bindings,
  MatchResult,
  NodeMatcher,
  ObjectMatcher,
  ValueMatcher,
} from "./match/types";

export type { Layout } from "./layout";

export default plugin;
