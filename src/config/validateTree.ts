import { type Tree } from "./types";

const FOLDER_RE = /^[^/]+\/$/;
const FILE_RE = /^[^/]+$/;

/**
 * Walk a contents tree and throw if any key violates the convention:
 * folder keys end with exactly one `/` (no internal `/`), file keys have no `/` at all,
 * and `**` is forbidden everywhere.
 */
export function validateTree(tree: Tree, path = ""): void {
  for (const key of Object.keys(tree)) {
    const here = path ? `${path}.${key}` : key;
    rejectBadKey(key, here);
    const value = tree[key];
    if (key.endsWith("/") && isNestedTree(value)) validateTree(value, here);
  }
}

function rejectBadKey(key: string, path: string): void {
  if (key === "") throw error(path, "empty keys are not allowed");
  if (key.includes("**")) throw error(path, "`**` is not allowed in keys; use nested folders instead");
  if (key.endsWith("/")) {
    if (!FOLDER_RE.test(key)) throw error(path, "folder keys must have exactly one trailing `/` and no internal `/`");
    return;
  }
  if (!FILE_RE.test(key)) throw error(path, "file keys must not contain `/`; nest folders explicitly instead");
}

function isNestedTree(value: unknown): value is Tree {
  return typeof value === "object" && value !== null && !("__isModule" in value);
}

function error(path: string, reason: string): Error {
  return new Error(`Invalid module key at "${path}": ${reason}.`);
}
