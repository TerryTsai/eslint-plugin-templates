import { plugin } from "../plugin";
import { type MatchTemplate } from "../types";

import { compareSpecificity } from "./specificity";
import { type ApplyOptions, type ClosedSpec, type Module, type Tree } from "./types";

interface FlatConfigBlock {
  files: string[];
  ignores?: string[];
  name?: string;
  languageOptions: { parser: unknown; parserOptions: Record<string, unknown> };
  plugins: Record<string, unknown>;
  rules: Record<string, unknown>;
}

type FileEntry = [string, MatchTemplate];
type FolderEntry = [string, Tree | Module];

const DEFAULT_PARSER_OPTIONS: Record<string, unknown> = { ecmaVersion: 2022, sourceType: "module" };

/**
 * Expand a module shape into ESLint flat-config blocks rooted at `options.root`.
 * Each file entry becomes a `templates/match` block; closed scopes add a
 * `templates/forbid` block targeting any unmatched file in that folder.
 */
export function applyModule(options: ApplyOptions): FlatConfigBlock[] {
  const blocks: FlatConfigBlock[] = [];
  expandTree(options.module.contents, options.module.closed, options.root, options, blocks);
  return blocks;
}

function expandTree(tree: Tree, closed: ClosedSpec | null, path: string, opts: ApplyOptions, blocks: FlatConfigBlock[]): void {
  const { files, folders } = partition(tree);
  files.sort(([a], [b]) => compareSpecificity(a, b));
  for (const [key, template] of files) blocks.push(matchBlock(`${path}/${key}`, template, opts));
  for (const [key, sub] of folders) expandFolder(key, sub, path, opts, blocks);
  if (closed) blocks.push(forbidBlock(path, files.map(([k]) => k), closed, opts));
}

function partition(tree: Tree): { files: FileEntry[]; folders: FolderEntry[] } {
  const files: FileEntry[] = [];
  const folders: FolderEntry[] = [];
  for (const [key, value] of Object.entries(tree)) {
    if (key.endsWith("/")) folders.push([key, value as Tree | Module]);
    else files.push([key, value as MatchTemplate]);
  }
  return { files, folders };
}

function expandFolder(key: string, sub: Tree | Module, path: string, opts: ApplyOptions, blocks: FlatConfigBlock[]): void {
  const isMod = isModule(sub);
  expandTree(isMod ? sub.contents : sub, isMod ? sub.closed : null, `${path}/${key.slice(0, -1)}`, opts, blocks);
}

function isModule(value: Tree | Module): value is Module {
  return "__isModule" in value && value.__isModule === true;
}

function commonBlockFields(opts: ApplyOptions): Pick<FlatConfigBlock, "languageOptions" | "plugins"> {
  return {
    languageOptions: { parser: opts.parser, parserOptions: { ...DEFAULT_PARSER_OPTIONS, ...opts.parserOptions } },
    plugins: { templates: plugin },
  };
}

function matchBlock(glob: string, template: MatchTemplate, opts: ApplyOptions): FlatConfigBlock {
  return {
    files: [glob],
    name: `templates:${template.id}@${glob}`,
    ...commonBlockFields(opts),
    rules: { "templates/match": ["error", template] },
  };
}

function forbidBlock(path: string, allowedFileKeys: string[], closed: ClosedSpec, opts: ApplyOptions): FlatConfigBlock {
  const ignores = allowedFileKeys.map((key) => `${path}/${key}`);
  return {
    files: closed.extensions.map((ext) => `${path}/*.${ext}`),
    ...(ignores.length > 0 && { ignores }),
    name: `templates:closed@${path}`,
    ...commonBlockFields(opts),
    rules: { "templates/forbid": ["error", { message: closed.message }] },
  };
}
