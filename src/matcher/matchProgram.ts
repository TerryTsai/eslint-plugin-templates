import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type ParsedTemplate } from "../parsing/parseTemplate";
import { type Slot } from "../types";

import { type MatchResult } from "./matchResult";
import { matchSequence } from "./sequence/matchSequence";

export function matchProgram(template: ParsedTemplate, fileAst: TSESTree.Program, slots: Record<string, Slot>): MatchResult {
  return matchSequence(template.ast.body, fileAst.body, slots, fileAst);
}
