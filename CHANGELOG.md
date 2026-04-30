# Changelog

## 0.6.0

Adds a TSESTree-flavored helper kit for building matchers without hand-rolling AST shapes.

### New

- **`eslint-plugin-templates/tsparser`** — 25+ helpers, each typed against the specific TSESTree node it produces:
  - Wrappers: `exportNamedDecl`, `exportDefaultDecl`, `exportAllDecl`, `importDecl`
  - Declarations: `functionDecl`, `arrowFunctionExpr`, `classDecl`, `variableDecl`, `typeAliasDecl`, `interfaceDecl`, `enumDecl`, `moduleDecl`
  - Atoms: `identifier`, `literal`, `decorator`
  - Class members: `methodDef`, `propertyDef`
  - Expressions: `callExpr`, `newExpr`, `memberExpr`, `awaitExpr`, `spreadElement`
  - TS types: `typeRef`, `unionType`, `intersectionType`, `literalType`
  - Plus `matcher<N>` (moved here from the main entry).

```js
import { exportNamedDecl, classDecl, identifier, decorator, callExpr } from "eslint-plugin-templates/tsparser";

const ctrl = exportNamedDecl(classDecl({
  id: identifier("OrdersController"),
  decorators: [decorator(callExpr({ callee: identifier("Controller") }))],
}));
```

vs. the equivalent hand-written AST tree (~16 lines of nested `match` objects).

### Moved

- `matcher<N>` → `eslint-plugin-templates/tsparser`. Still re-exported from the main entry for backwards compatibility; prefer the subpath import going forward.

### Internal

- `src/matcher/` folder replaces the single `src/matcher.ts`. `common.ts` houses parser-agnostic tags (`bind`, `regex`); `tsparser.ts` houses the TSESTree helpers.
- `ValueMatcher<T>` gained an array-element branch — when `T` is an array, `NodeMatcher<E>[]` is now a typed list-pairing form (previously only the alternation form was typed correctly).

## 0.5.0

**Breaking refactor.** Earlier versions used a closed-vocabulary discriminated union baked around TSESTree (five slot variants × twelve named refinements). v0.5 reverses this: the engine is parser-agnostic and matches by raw AST property, and matchers are pure JSON-serializable data so they survive ESLint v9's flat-config option cloning.

### Engine

- `NodeMatcher` — `{ name?, min?, max?, match }` where `match` is an `ObjectMatcher`.
- `ObjectMatcher<T>` — `{ [K in keyof T]?: ValueMatcher<T[K]> }`, a partial map of AST keys to value matchers.
- `ValueMatcher<T>` — primitive (equality), `NodeMatcher` (recurse), array (list-pairing or alternation), `{ "@regex" }` (string test), `{ "@bind" }` (cross-position binding). No function form.
- Single walk over the matcher tree, no privileged keys.

### Public API

```ts
import {
  compile,
  matchConfig, forbidConfig, layoutConfig,
  bind, regex, matcher,
  type Layout, type NodeMatcher, type ObjectMatcher, type ValueMatcher,
} from "eslint-plugin-templates";
```

- **`compile(template, matchers, parse)`** — parses a template body and substitutes matchers at `{{NAME}}` placeholders. Third argument is any `(source: string) => ast` function — bring your own parser.
- **`matchConfig`** / **`forbidConfig`** / **`layoutConfig`** — flat-config block builders. `matchConfig` and `forbidConfig` produce one block each; `layoutConfig` expands a `Layout` into many.
- **`bind(name)`** / **`regex(pattern, flags?)`** — sugar for the `@bind`/`@regex` value-matcher tags.
- **`matcher<N>(m)`** — runtime no-op that asks TypeScript to narrow `match` against a TSESTree node type `N`.

### Layout

A `Layout` is a plain object literal: optional `closed` plus a `content` map keyed by file (`"foo.ts"`, `"*.ts"`) or folder (`"sub/"`). Folder values are nested `Layout`s. The `Layout<L>` generic validates user literals at compile time — bad keys, value-type mismatches, and stray patterns surface as type errors at the call site.

```js
{
  closed: { message: "Service folders only contain index, types, and handlers." },
  content: {
    "index.ts": indexTemplate,
    "types.ts": typesTemplate,
    "handlers/": { content: { "*.ts": handlerTemplate } },
  },
}
```

`closed` propagates to descendants without their own setting.

### Removed

- Closed-vocabulary slot variants and named refinements.
- TS-SyntaxKind logical-name layer; v0.5 uses raw `type` strings directly.
- `defineModule` / `applyModule` / `Module` (renamed) and the `eslint-plugin-templates/config` subpath.
- Function-valued `ValueMatcher`. Use `bind`/`regex` tags or explicit AST shapes.
- Combinators (`anyOf`, `allOf`, `not`, `oneOf`). Use array alternation (`[a, b, c]`) at value positions or array list-pairing at array-value positions.
- Registry workaround (matchers are now pure data, no shim needed).
- Standalone `layout()` constructor; layouts are plain object literals.
- Subpaths `/layout` and `/tsestree`; everything is exported from the main entry.
- Public types `Tree`, `ClosedSpec`, `FlatConfigBlock`. Use ESLint's `TSESLint.FlatConfig.Config` from `@typescript-eslint/utils` for the config-block shape.

### Renames

- `defineModule` / `applyModule` → plain `Layout` literal / `layoutConfig`.
- `matchBlock` / `forbidBlock` → `matchConfig` / `forbidConfig`.
- `Module` type → `Layout`.
- `contents` field → `content`.
- `closed: true` shorthand → `closed: {}`.

### Migration

- **Templates.** Replace `{ id, body, slots }` with `{ name, match: compile(body, matchers, parse) }`. The parse function is `(src) => parser.parseForESLint(src, opts).ast`.
- **Layouts.** Replace `defineModule({ contents, closed })` with a plain object `{ closed, content }`. Replace `applyModule({ module, root, parser })` with `layoutConfig({ root, layout, languageOptions: { parser } })`.
- **Per-block helpers.** `matchBlock` / `forbidBlock` → `matchConfig` / `forbidConfig`.
- **Refinements.** Spell out the AST shape directly, e.g. `{ type: "ExportNamedDeclaration", declaration: { match: { type: "FunctionDeclaration" } } }` instead of `exported: true`.
- **Imports.** Drop `eslint-plugin-templates/layout` and `eslint-plugin-templates/tsestree`; everything comes from the main entry.

## 0.4.0

**Breaking:** `closed` on a `defineModule` now propagates to descendant folders that don't declare their own. Before, `closed` was strictly local. Set it once at the top of a tree and the whole subtree is locked; nested modules with their own `closed` continue to override (different message, different extensions, etc.).

If you had `closed` only at the top of a tree before, descendant folders are now locked too. To opt a subtree out, wrap it in a `defineModule` and either omit `closed` or override it.

## 0.3.0

**Breaking:** placeholder syntax changed from `${SLOT}` to `{{SLOT}}`. Every existing template body needs the substitution.

The new syntax doesn't collide with JS template-literal interpolation, so multi-line backtick bodies work without escapes:

```js
body: `
  {{IMPORTS}}
  {{HANDLER}}
`
```

Other changes:

- Internal: `Module` is now branded with a `Symbol` instead of an `__isModule` string discriminator.
- Internal: `ApplyOptions.parser` is typed structurally instead of `unknown`.
- Internal: refinement dispatch table reworked to preserve per-key types end-to-end.
- Internal: plugin `meta` is read from `package.json` at runtime — no more hand-maintained `version` copy.
- Internal: `src/config/internal/` separates `applyModule`/`defineModule`/`types` from helpers.
- Documentation pass to remove redundancy and over-explanation.

## 0.2.1

Internal cleanup. No public API or behavior changes.

- Several `if/return; return` patterns collapsed to ternaries where the branches are pure expressions.
- `partition` (`applyModule.ts`) reshaped to a declarative two-filter form.
- `expandFolder` destructures `{ contents, closed }` once instead of checking `isModule` twice.
- `normalizeClosed` (`defineModule.ts`) unifies the `closed === true` and object cases into a single return path.
- `getParsed` (`match.ts`) replaces the `let`-and-double-assign idiom with explicit cache hit / miss branches.
- Tightened `parsedCache` key type and dropped the over-explicit return type on `commonBlockFields`.

## 0.2.0

New `eslint-plugin-templates/config` subpath for describing whole-folder layouts as reusable modules.

- `defineModule({ contents, closed? })` — declarative tree of file and folder entries. Folder keys end with `/` and take a nested tree (or another `defineModule` for folder-local options); file keys take a `MatchTemplate`. Multi-segment keys and `**` are rejected statically (template literal types) and at runtime.
- `applyModule({ module, root, parser, parserOptions? })` — expands a module into ESLint flat-config blocks rooted at the given path. Sibling globs auto-sort by specificity (most-specific wins via ESLint's last-match semantics). `closed: true | { message, extensions }` emits a `templates/forbid` block per folder.
- Modules are pure data — define once, apply at multiple roots.
- Reference: [docs/modules.md](./docs/modules.md). README "Modules" section walks through a microservice resource example.

## 0.1.2

Internal cleanup. No public API or behavior changes.

- Folder restructure: `parsing/` pulled out of `matcher/` to reflect that template body parsing is preprocessing, separate from matching.
- Plugin self-dogfooding extended; `brace-style` rule enforces multi-line function bodies.
- Tooling refresh: vitest 3.2.4, GitHub Actions `checkout`/`setup-node` v6, Node 24 in CI.

## 0.1.1

Internal cleanup. No public API or behavior changes.

- Matcher reorganized into `parsing/`, `kinds/`, `refinements/checks/`, `sequence/` subfolders, one export per file.
- Plugin now self-dogfoods: ESLint config applies the plugin's own `templates/match` rule to its source files.

## 0.1.0

Initial release.

- `templates/match` — match files against declarative templates. Five slot variants (Import, Function, Property, Literal, Any) with twelve refinements covering AST kind, identifier name, import source, async/exported/default flags, parameter count, return-type kind, property value kind, optional/readonly flags, and literal pattern.
- `templates/forbid` — reject every file matched by the rule's `files` glob, with an optional custom message. Pairs with ESLint's `ignores` to allow-list specific files.
- Cross-position inline binding: the same `${NAME}` placeholder in multiple positions in the body unifies on the file's identifier.
- Six diagnostic messageIds (`divergence`, `missingRequired`, `refinementFailed`, `bindingMismatch`, `extraContent`, `unknownSlot`) for `templates/match`; one (`forbidden`) for `templates/forbid`.
- Strict JSON Schema for both rules' options — cross-variant refinements are rejected at config-load time.
- TypeScript-first: parses templates and target files via `@typescript-eslint/typescript-estree`. Peer-depends on `eslint >= 8`.
