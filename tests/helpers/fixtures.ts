import * as parser from "@typescript-eslint/parser";

import { layoutConfig } from "../../src/config";
import { type Layout } from "../../src/layout";
import { type NodeMatcher } from "../../src/match/types";

export const A: NodeMatcher = { name: "a", match: {} };
export const B: NodeMatcher = { name: "b", match: {} };
export const C: NodeMatcher = { name: "c", match: {} };

export function blocksFor<L extends Layout>(layout: Layout<L> & L, root = "src/x") {
  return layoutConfig({ root, layout, languageOptions: { parser } });
}
