import { type MatchTemplate } from "../types";

/**
 * Recursive tree describing a module's contents.
 * Folder keys end with `/` and take a nested tree; file keys (literal names
 * or single-folder globs like `*.ts`) take a `MatchTemplate`. Nested folders
 * may also be `Module` values to attach folder-local options like `closed`.
 */
export type Tree = {
  readonly [key: string]: MatchTemplate | Tree | Module;
};

/**
 * Compile-time check that a key obeys the trailing-slash convention:
 * non-empty, no `**`, no internal slashes. Resolves to the key when valid,
 * otherwise to `never` (which makes the value position un-satisfiable so
 * defineModule call sites surface a TypeScript error).
 */
export type ValidKey<K extends string> =
  K extends "" ? never
  : K extends `${string}**${string}` ? never
  : K extends `${string}/${string}/${string}` ? never
  : K extends `${infer Inner}/`
    ? Inner extends `${string}/${string}` ? never : K
    : K extends `${string}/${string}` ? never
    : K;

/**
 * Mapped type that validates each key in a contents tree and constrains
 * each value: file keys must hold a `MatchTemplate`; folder keys must hold
 * either a `Module` or another (recursively validated) tree. Used by
 * `defineModule` so violations surface at the call site, not at apply time.
 */
export type ValidatedTree<T> = {
  [K in keyof T & string]:
    ValidKey<K> extends never
      ? never
      : K extends `${string}/`
        ? T[K] extends Module ? T[K] : ValidatedTree<T[K]>
        : T[K] extends MatchTemplate ? T[K] : never;
};

/**
 * Forbid any file in the folder not covered by a direct entry.
 * Per-folder; nested folders own their own scope.
 */
export interface ClosedSpec {
  readonly message: string;
  readonly extensions: readonly string[];
}

/**
 * A reusable module shape: contents tree + optional closed-scope rejection.
 * Modules are pure data — reuse across multiple roots by calling `applyModule` once per root.
 */
export interface Module {
  readonly __isModule: true;
  readonly contents: Tree;
  readonly closed: ClosedSpec | null;
}

export interface ModuleOptions {
  contents: Tree;
  closed?: boolean | { message?: string; extensions?: readonly string[] };
}

export interface ApplyOptions {
  module: Module;
  root: string;
  parser: unknown;
  parserOptions?: Record<string, unknown>;
}
