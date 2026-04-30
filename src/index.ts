import { plugin } from "./plugin";

export { compile } from "./compile";
export { forbidConfig, layoutConfig, matchConfig } from "./config";
export { bind, regex } from "./matcher/common";
export { matcher } from "./matcher/tsparser";

export type {
  Bindings,
  MatchResult,
  NodeMatcher,
  ObjectMatcher,
  ValueMatcher,
} from "./match/types";

export type { Layout } from "./layout";

export default plugin;
