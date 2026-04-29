import { expect, it } from "vitest";

import { matchProgram } from "../../src/matcher/matchProgram";
import { parseTemplate } from "../../src/parsing/parseTemplate";
import { type Slot } from "../../src/types";
import { parseFile } from "../_helpers/parsing";

const HOOKS_TEMPLATE = parseTemplate(`
  import { useState } from "react";
  {{HOOKS}}
`);

const HOOKS_SLOTS: Record<string, Slot> = {
  HOOKS: { type: "FunctionDeclaration", minOccurs: 1, maxOccurs: 5 },
};

it("matchProgram — literal: matches a literal-only template against an exact file", () => {
  const tpl = parseTemplate(`import { useState } from "react";`);
  const file = parseFile(`import { useState } from "react";`);
  expect(matchProgram(tpl, file, {}).ok).toBe(true);
});

it("matchProgram — literal: rejects when the file's literal differs", () => {
  const tpl = parseTemplate(`import { useState } from "react";`);
  const file = parseFile(`import { useEffect } from "react";`);
  const result = matchProgram(tpl, file, {});
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.messageId).toBe("divergence");
});

it("matchProgram — literal: matches a literal statement followed by a placeholder slot", () => {
  const file = parseFile(`
    import { useState } from "react";
    function useThing() {}
    function useOther() {}
  `);
  expect(matchProgram(HOOKS_TEMPLATE, file, HOOKS_SLOTS).ok).toBe(true);
});

it("matchProgram — literal: rejects when the literal portion diverges even though slots could match", () => {
  const file = parseFile(`
    import { useEffect } from "react";
    function useThing() {}
  `);
  const result = matchProgram(HOOKS_TEMPLATE, file, HOOKS_SLOTS);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.messageId).toBe("divergence");
});

it("matchProgram — literal: matches a literal shell with an inline placeholder for the function name", () => {
  const tpl = parseTemplate(`export function {{NAME}}() { return null; }`);
  const file = parseFile(`export function widget() { return null; }`);
  expect(matchProgram(tpl, file, {}).ok).toBe(true);
});

it("matchProgram — literal: rejects when the literal body of an inline-placeholder shell does not match", () => {
  const tpl = parseTemplate(`export function {{NAME}}() { return null; }`);
  const file = parseFile(`export function widget() { return 42; }`);
  const result = matchProgram(tpl, file, {});
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.messageId).toBe("divergence");
});
