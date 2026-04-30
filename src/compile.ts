import { type NodeMatcher, type ObjectMatcher } from "./match/types";
import { bind } from "./matcher";

const PLACEHOLDER_REGEX = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
const PREFIX = "__TEMPLATE_VAR_";
const SUFFIX = "__";
const SKIPPED: ReadonlySet<string> = new Set([
  "loc", "range", "start", "end", "parent", "comments", "tokens",
]);

/**
 * Compile a template body into an `ObjectMatcher` tree. Statement-position
 * placeholders (`{{NAME}}`) substitute matchers from the map; identifier-
 * position placeholders create cross-position bindings.
 */
export function compile(
  template: string,
  matchers: Record<string, NodeMatcher> | undefined,
  parse: (source: string) => unknown,
): ObjectMatcher {
  const preprocessed = template.replace(PLACEHOLDER_REGEX, (_, name: string) => `${PREFIX}${name}${SUFFIX}`);
  const ast = parse(preprocessed);
  if (!isObject(ast)) throw new Error("parse must return an object AST");
  return walkObject(ast, matchers ?? {});
}

function walkObject(node: Record<string, unknown>, matchers: Record<string, NodeMatcher>): ObjectMatcher {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(node)) {
    if (SKIPPED.has(key)) continue;
    const v = node[key];
    if (v !== undefined) out[key] = walkValue(v, matchers);
  }
  return out as ObjectMatcher;
}

function walkValue(value: unknown, matchers: Record<string, NodeMatcher>): unknown {
  if (Array.isArray(value)) return value.map((item) => walkArrayItem(item, matchers));
  if (isObject(value)) return walkNode(value, matchers);
  return value;
}

function walkArrayItem(item: unknown, matchers: Record<string, NodeMatcher>): unknown {
  if (!isObject(item)) return item;
  if (item["type"] === "ExpressionStatement") {
    const expr = item["expression"];
    const name = isObject(expr) ? identifierPlaceholder(expr) : null;
    if (name !== null) return resolveMatcher(name, matchers);
  }
  return walkNode(item, matchers);
}

function walkNode(node: Record<string, unknown>, matchers: Record<string, NodeMatcher>): NodeMatcher {
  if (node["type"] === "Identifier") {
    const name = identifierPlaceholder(node);
    if (name !== null) return { match: { type: "Identifier", name: bind(name) } };
  }
  return { match: walkObject(node, matchers) };
}

function resolveMatcher(name: string, matchers: Record<string, NodeMatcher>): NodeMatcher {
  const m = matchers[name];
  if (!m) throw new Error(`Template placeholder "{{${name}}}" has no matcher`);
  return m.name === undefined ? { ...m, name } : m;
}

function identifierPlaceholder(node: Record<string, unknown>): string | null {
  const name = node["name"];
  if (typeof name !== "string" || !name.startsWith(PREFIX) || !name.endsWith(SUFFIX)) return null;
  return name.slice(PREFIX.length, -SUFFIX.length);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
