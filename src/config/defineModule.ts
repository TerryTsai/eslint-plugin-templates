import { type ClosedSpec, type Module, type ModuleOptions, type Tree, type ValidatedTree } from "./types";
import { validateTree } from "./validateTree";

const DEFAULT_CLOSED_MESSAGE = "This file is not allowed in the current scope.";
const DEFAULT_CLOSED_EXTENSIONS = ["ts"] as const;

/**
 * Define a reusable module shape. The generic constrains `contents` so each
 * key obeys the trailing-slash convention at compile time: multi-segment keys,
 * `**`, and missing slashes surface as TypeScript errors at the call site.
 * Runtime validation runs as a defense in depth, then the result is frozen.
 */
export function defineModule<T extends Tree>(options: {
  contents: ValidatedTree<T> & T;
  closed?: ModuleOptions["closed"];
}): Module {
  validateTree(options.contents);
  const closed = normalizeClosed(options.closed);
  const module: Module = {
    __isModule: true,
    contents: deepFreeze(options.contents),
    closed,
  };
  return Object.freeze(module);
}

function normalizeClosed(closed: ModuleOptions["closed"]): ClosedSpec | null {
  if (!closed) return null;
  const opts = closed === true ? {} : closed;
  return Object.freeze({
    message: opts.message ?? DEFAULT_CLOSED_MESSAGE,
    extensions: Object.freeze([...(opts.extensions ?? DEFAULT_CLOSED_EXTENSIONS)]),
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}
