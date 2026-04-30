# `templates/match`

Match a file's whole-program shape against a `NodeMatcher`. The rule's option is a `NodeMatcher` that walks the file's `Program`.

## Foundation

```ts
type NodeMatcher<T = unknown> = {
  name?: string;
  min?: number;
  max?: number;
  match: ObjectMatcher<T>;
};
```

- `name` is the diagnostic label.
- `min` / `max` are cardinality bounds, only meaningful at list positions (e.g. inside a `body: [...]` array).
- `match` is an `ObjectMatcher<T>` — a partial map from each key of `T` to a `ValueMatcher`.

```ts
type ValueMatcher<T> =
  | T                                     // primitive equality
  | NodeMatcher<T>                        // recurse on a sub-node
  | NodeMatcher<T>[]                      // list-pairing or alternation
  | { "@regex": string; flags?: string }  // regex test (string targets only)
  | { "@bind": string };                  // cross-position binding
```

The engine walks raw AST properties — whatever keys the matcher pins must equal whatever the actual node has at those keys; everything else is unconstrained.

## Building a matcher: `compile`

```ts
function compile(
  template: string,
  matchers: Record<string, NodeMatcher> | undefined,
  parse: (source: string) => unknown,
): ObjectMatcher;
```

Parses `template` with the supplied `parse` function, replaces `{{NAME}}` placeholders with the matchers from the map, and returns the resulting `ObjectMatcher`. Inline `{{NAME}}` (at identifier positions) becomes a `bind(NAME)` tag automatically — cross-position consistency is enforced.

```js
const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;
```

## Cardinality

| Configuration | Meaning |
|---|---|
| neither set | exactly 1 |
| `min: 0` only | 0 or more |
| `min: N` only (N ≥ 1) | N or more |
| `max: M` only | up to M, default min 1 |
| both | between min and max, inclusive |

`min` / `max` only apply where the matcher sits in a parent's list (e.g. a `body: [...]` element). At a singular property position they have no effect.

## Cross-position binding

`compile` recognizes `{{NAME}}` as both a statement-level placeholder (replaced by `matchers[NAME]`) and an inline identifier placeholder (replaced by an Identifier matcher whose `name` is `{ "@bind": "NAME" }`):

```js
match: compile(`
  function {{NAME}}() {}
  export { {{NAME}} };
`, {}, parse),
```

The first occurrence binds; subsequent occurrences must agree.

## Type-safe authoring

```ts
import { matcher } from "eslint-plugin-templates";
import { type TSESTree } from "@typescript-eslint/utils";

const m = matcher<TSESTree.FunctionDeclaration>({
  name: "handler",
  match: { type: "FunctionDeclaration", async: true },
});
```

`matcher<N>` is a runtime no-op that asks TypeScript to narrow `match` against the chosen TSESTree node type — typos in keys fail at compile time.

## Diagnostic

Single message ID: `divergence`. The diagnostic includes the template name (when set), a path into the tree, and the failure reason.

## Limitations

- One template per rule invocation.
- No autofix.
- No type-resolved checks; everything is syntactic.

## Authoring tips

- Placeholder names must be uppercase letters, digits, and underscores: `[A-Z_][A-Z0-9_]*`.
- The same `{{NAME}}` in multiple inline positions unifies. Use distinct names for unrelated slots.
