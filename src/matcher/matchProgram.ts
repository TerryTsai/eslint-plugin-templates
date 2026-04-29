import { type TSESTree } from "@typescript-eslint/typescript-estree";

import { type ParsedTemplate } from "../parsing/parseTemplate";
import { type Slot } from "../types";

import { type MatchResult } from "./matchResult";
import { matchSequence } from "./sequence/matchSequence";

/**
 * Match a file's program body against a parsed template's program body.
 * The walker consumes file nodes for each `${SLOT}` placeholder per the slot's
 * type, cardinality, and refinements; literal template AST must match exactly.
 * Returns the first divergence on failure.
 */
export function matchProgram(template: ParsedTemplate, fileAst: TSESTree.Program, slots: Record<string, Slot>): MatchResult {
  return matchSequence(template.ast.body, fileAst.body, slots, fileAst);
}
