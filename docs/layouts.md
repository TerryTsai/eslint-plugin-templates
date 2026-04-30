# Layouts

For codebases where many folders share the same shape, describe the layout as a plain object and let `layoutConfig` expand it into ESLint flat-config blocks. Per-block helpers (`matchConfig`, `forbidConfig`) build individual config blocks for use outside the layout system.

## `Layout`

```ts
type Layout = {
  readonly closed?: { readonly message?: string; readonly extensions?: readonly string[] };
  readonly content: { readonly [key: string]: NodeMatcher | Layout };
};
```

A `Layout` is a plain object literal:

- `content` is a recursive map. Keys ending in `/` are folders; their value is another `Layout`. Keys without `/` are files — literal names (`"index.ts"`) or single-folder globs (`"*.ts"`, `"*.test.ts"`). Multi-segment keys (`"a/b/c.ts"`) and `**` are rejected at compile time; nest folders explicitly.
- `closed` rejects any file in the folder not matched by a direct entry. Empty object `{}` uses defaults (`extensions: ["ts"]`, a generic message); supply `message` and/or `extensions` to override. The setting propagates to descendant folders that don't declare their own — set it once at the top to lock the whole subtree.

## `layoutConfig`

```ts
function layoutConfig<L extends Layout>(opts: {
  root: string;
  layout: Layout<L> & L;
  severity?: "error" | "warn";
} & Omit<TSESLint.FlatConfig.Config, "files">): TSESLint.FlatConfig.Config[];
```

Expands a layout into ESLint flat-config blocks rooted at `root`. Captured fields drive the rule (`root` and `layout` build the file-glob structure; `severity` scopes both `templates/match` and `templates/forbid`); everything else passes through to every generated block.

```js
layoutConfig({
  root: "src/api/*",
  layout: apiResource,
  languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 2022 } },
  plugins: { "@typescript-eslint": tsPlugin },
  rules: { "no-console": "error" },
});
```

`languageOptions`, `plugins`, `rules`, `settings` and any other field flow through to each generated block. `plugins` and `rules` deep-merge with the templates-rule entries; user values win on collision.

## Per-block builders

When you need a single block instead of a tree, `matchConfig` and `forbidConfig` build one block each:

```ts
function matchConfig(opts: {
  files: string | string[];
  template: NodeMatcher;
  severity?: "error" | "warn";
} & Omit<TSESLint.FlatConfig.Config, "files">): TSESLint.FlatConfig.Config;

function forbidConfig(opts: {
  files: string | string[];
  message?: string;
  severity?: "error" | "warn";
} & Omit<TSESLint.FlatConfig.Config, "files">): TSESLint.FlatConfig.Config;
```

Same pass-through semantics. Use these for one-off blocks (e.g. shaping `eslint.config.mjs` itself) or to compose your own layout helpers.

## Specificity

Sibling file-keys in a folder are emitted in order of increasing specificity, so ESLint's last-wins applies the most-specific rule. Specificity = fewer wildcards is more specific; ties broken by literal-character count.

```
"*.ts": baseTemplate,
"*.test.ts": testTemplate,
"index.ts": entryTemplate,
```

emits in order: `*.ts` → `*.test.ts` → `index.ts`. A file named `index.ts` is matched by all three blocks; ESLint applies the last (entry).

## Closed cascade

`closed` set on a parent layout applies to all descendant folders that don't override it. To opt a subtree out, declare a nested layout without `closed`.

```js
{
  closed: {},
  content: {
    "core/": { content: { /* inherits closed */ } },
    "experiments/": { content: { /* inherits closed; declare own to override */ } },
  },
};
```
