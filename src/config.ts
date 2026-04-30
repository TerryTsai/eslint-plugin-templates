import { type TSESLint } from "@typescript-eslint/utils";

import { type Layout } from "./layout";
import { type NodeMatcher } from "./match/types";
import { plugin } from "./plugin";

/** Single flat-config block applying `templates/match`; non-captured fields pass through. */
export function matchConfig(opts: Omit<TSESLint.FlatConfig.Config, "files"> & {
  files: string | string[];
  template: NodeMatcher;
  severity?: "error" | "warn";
}): TSESLint.FlatConfig.Config {
  const { files, template, severity = "error", plugins, rules, ...rest } = opts;
  return {
    ...rest,
    files: Array.isArray(files) ? files : [files],
    plugins: { templates: plugin, ...plugins },
    rules: { "templates/match": [severity, template], ...rules },
  };
}

/** Single flat-config block applying `templates/forbid`; non-captured fields pass through. */
export function forbidConfig(opts: Omit<TSESLint.FlatConfig.Config, "files"> & {
  files: string | string[];
  message?: string;
  severity?: "error" | "warn";
}): TSESLint.FlatConfig.Config {
  const { files, ignores, message, severity = "error", plugins, rules, ...rest } = opts;
  const block: TSESLint.FlatConfig.Config = {
    ...rest,
    files: Array.isArray(files) ? files : [files],
    plugins: { templates: plugin, ...plugins },
    rules: { "templates/forbid": [severity, message ? { message } : {}], ...rules },
  };
  if (ignores?.length) block.ignores = ignores;
  return block;
}

/**
 * Expand a `Layout` into flat-config blocks rooted at `root`. File entries
 * become `templates/match` blocks; `closed` adds a per-folder `templates/forbid`
 * block and propagates to descendants without their own.
 */
export function layoutConfig<L extends Layout>(options: Omit<TSESLint.FlatConfig.Config, "files"> & {
  root: string;
  layout: Layout<L> & L;
  severity?: "error" | "warn";
}): TSESLint.FlatConfig.Config[] {
  const { root, layout, severity = "error", ...pass } = options;
  const out: TSESLint.FlatConfig.Config[] = [];
  expandLayout(layout, null, root, severity, pass, out);
  return out;
}

function expandLayout(
  layout: Layout, inherited: { message: string; extensions: readonly string[] } | null, path: string,
  severity: "error" | "warn", pass: Omit<TSESLint.FlatConfig.Config, "files">, out: TSESLint.FlatConfig.Config[],
): void {
  const closed = layout.closed !== undefined ? normalizeClosed(layout.closed) : inherited;
  const entries = Object.entries(layout.content);
  const files = entries.filter((e): e is [string, NodeMatcher] => "match" in e[1]);
  files.sort(([a], [b]) => compareSpecificity(a, b));
  for (const [key, template] of files) out.push(matchConfig({ ...pass, files: `${path}/${key}`, template, severity }));
  for (const [key, sub] of entries) {
    if ("content" in sub) expandLayout(sub, closed, `${path}/${key.slice(0, -1)}`, severity, pass, out);
  }
  if (closed) out.push(forbidConfig({
    ...pass, severity, message: closed.message,
    files: closed.extensions.map((e) => `${path}/*.${e}`),
    ignores: files.map(([k]) => `${path}/${k}`),
  }));
}

function normalizeClosed(closed: NonNullable<Layout["closed"]>): { message: string; extensions: readonly string[] } {
  return {
    message: closed.message ?? "This file is not allowed in the current scope.",
    extensions: closed.extensions ?? ["ts"],
  };
}

/** More-specific patterns sort LATER so ESLint's last-wins applies them. */
function compareSpecificity(a: string, b: string): number {
  const aWild = (a.match(/\*/g) ?? []).length;
  const bWild = (b.match(/\*/g) ?? []).length;
  return aWild !== bWild ? bWild - aWild : a.replace(/\*/g, "").length - b.replace(/\*/g, "").length;
}
