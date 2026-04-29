import { placeholderName } from "../parsing/placeholderName";

import { type BindingContext } from "./bindingContext";

const LOCATION_KEYS: ReadonlySet<string> = new Set(["loc", "range", "start", "end", "parent"]);

type ObjectLike = Record<string, unknown>;

export function structurallyEqual(a: unknown, b: unknown, ctx: BindingContext): boolean {
  if (a === b) return true;
  if (notSameObjectShape(a, b)) return false;
  if (Array.isArray(a)) return arraysEqual(a, b, ctx);
  if (Array.isArray(b)) return false;
  return objectsEqual(a as ObjectLike, b as ObjectLike, ctx);
}

function notSameObjectShape(a: unknown, b: unknown): boolean {
  return typeof a !== typeof b || a === null || b === null || typeof a !== "object";
}

function arraysEqual(a: unknown[], b: unknown, ctx: BindingContext): boolean {
  if (!Array.isArray(b) || a.length !== b.length) return false;
  return a.every((item, i) => structurallyEqual(item, b[i], ctx));
}

function objectsEqual(ao: ObjectLike, bo: ObjectLike, ctx: BindingContext): boolean {
  const placeholder = identifyPlaceholder(ao);
  if (placeholder !== null) return matchPlaceholder(placeholder, bo, ctx);
  if (typeof ao["type"] === "string" && ao["type"] !== bo["type"]) return false;
  return childKeysEqual(ao, bo, ctx);
}

function identifyPlaceholder(ao: ObjectLike): string | null {
  if (ao["type"] !== "Identifier" || typeof ao["name"] !== "string") return null;
  return placeholderName(ao["name"]);
}

function matchPlaceholder(name: string, bo: ObjectLike, ctx: BindingContext): boolean {
  if (bo["type"] !== "Identifier" || typeof bo["name"] !== "string") return false;
  const bound = ctx.inline.get(name);
  if (bound === undefined) {
    ctx.inline.set(name, bo["name"]);
    return true;
  }
  if (bound === bo["name"]) return true;
  ctx.mismatch = { name, bound, got: bo["name"] };
  return false;
}

function childKeysEqual(ao: ObjectLike, bo: ObjectLike, ctx: BindingContext): boolean {
  const aKeys = Object.keys(ao).filter((k) => !LOCATION_KEYS.has(k));
  if (aKeys.length !== Object.keys(bo).filter((k) => !LOCATION_KEYS.has(k)).length) return false;
  return aKeys.every((k) => k in bo && structurallyEqual(ao[k], bo[k], ctx));
}
