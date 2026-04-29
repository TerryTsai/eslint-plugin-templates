# Modules

A higher-level way to declare ESLint configuration for codebases where many folders share a structural shape. A module describes "what files live here and what each one looks like" as a single tree; `applyModule` wires it to a root path.

## When to reach for it

Use a module when you'd otherwise write multiple `templates/match` (and `templates/forbid`) config blocks for the same folder shape. Stick with raw `templates/match` when you have a single template applied to a single glob — the module wrapper isn't doing much for you there.

## API

```ts
import { applyModule, defineModule } from "eslint-plugin-templates/config";

defineModule(options: ModuleOptions): Module
applyModule(options: ApplyOptions): FlatConfigBlock[]
```

```ts
type ModuleOptions = {
  contents: Tree;
  closed?: boolean | { message?: string; extensions?: readonly string[] };
};

type Tree = {
  // folder key: trailing `/`, value is a nested Tree or another Module
  // file key: no `/`, value is a MatchTemplate
  [key: string]: MatchTemplate | Tree | Module;
};

type ApplyOptions = {
  module: Module;
  root: string;
  parser: unknown;                       // ESLint parser module (e.g. @typescript-eslint/parser)
  parserOptions?: Record<string, unknown>;
};
```

`defineModule` validates the tree, freezes the result, and returns an opaque `Module`. `applyModule` expands a `Module` into an array of ESLint flat-config blocks rooted at `options.root`.

## Tree conventions

- **Folder keys** end in `/` — `"kinds/"`, `"refinements/"`. Their value is another `Tree` (or a `Module` for folder-local options like `closed`).
- **File keys** have no `/` — literal names (`"index.ts"`) or single-folder globs (`"*.ts"`, `"*.test.ts"`). Their value is a `MatchTemplate`.
- **Multi-segment keys** (`"a/b/c.ts"`) are rejected. Nest folders explicitly.
- **`**`** is rejected anywhere in a key. Modules describe structure; `**` undermines the structural premise.

Violations throw at `defineModule` time with a message naming the offending key path.

## Sibling glob precedence

Within a single folder, sibling keys may overlap. `applyModule` orders them by specificity so ESLint's last-wins semantics applies the most-specific rule:

- Fewer wildcards is more specific.
- Among ties, more literal characters is more specific.

So `{ "*.ts": A, "*.test.ts": B, "index.ts": C }` emits in order `*.ts` → `*.test.ts` → `index.ts`. For `index.ts`, all three blocks match; `templates/match` from the `index.ts` block wins. The order keys are written in does not matter.

## Closed scope

`closed: true` (or `closed: { message, extensions }`) emits a `templates/forbid` block over the folder. Any file matching `${root}/${path}/*.${ext}` that isn't matched by a direct entry triggers the diagnostic.

Defaults:
- `message`: `"This file is not allowed in the current scope."`
- `extensions`: `["ts"]`

Scoping rules:
- `closed` only acts on the folder where it's declared. Nested folders own their own scope.
- `closed` only fires on lint-able files. Non-TS files (e.g. `.md`, `.json`) won't be touched unless ESLint is configured to lint them.
- `closed` rejects extras (upper bound). It does **not** require minimum members — ESLint lints existing files; it never sees what isn't there.

## Nesting and folder-local options

A folder value can be either a plain `Tree` (just contents) or another `defineModule` (contents plus options like `closed`). A microservice resource with a nested validation folder:

```js
const apiResourceModule = defineModule({
  contents: {
    "router.ts": routerTemplate,
    "controller.ts": controllerTemplate,
    "service.ts": serviceTemplate,
    "model.ts": modelTemplate,
    "validation/": defineModule({                    // nested module with its own closed scope
      closed: true,
      contents: {
        "schema.ts": schemaTemplate,
        "validators/": { "*.ts": validatorTemplate }, // plain tree
      },
    }),
    "*.test.ts": testTemplate,
  },
});
```

## Reuse across roots

Modules are pure data. Apply the same shape to multiple roots:

```js
export default [
  ...applyModule({ module: apiResourceModule, root: "src/api/*", parser: tsParser }),
  ...applyModule({ module: apiResourceModule, root: "apps/*/api/*", parser: tsParser }),
];
```

Each `applyModule` call produces an independent set of flat-config blocks. `root` itself can be a glob — `"src/api/*"` means "every direct child of `src/api/`."

## Block names for debugging

Each emitted block carries a `name` identifying its position in the tree:

- Match blocks: `"templates:<template.id>@<glob>"`, e.g. `"templates:api-router@src/api/users/router.ts"`
- Forbid blocks: `"templates:closed@<path>"`, e.g. `"templates:closed@src/api/users"`

Run `npx eslint --print-config <file>` to see which named block applied to a given file.

## Limitations

- Modules enforce *upper bounds* (forbid extras with `closed`) but not *lower bounds* — ESLint can't require a file that doesn't exist. Documented expectations of "must have index.ts" need a different tool (script, pre-commit hook, etc.).
- One template per file. If you need a file to satisfy multiple constraints, combine them in a single template.
- Two `applyModule` calls covering the same file path both emit blocks; ESLint's last-wins semantics applies. Avoid overlapping roots, or accept the resulting precedence.
- Module expansion scales with leaf count. Realistic trees (tens to low hundreds of leaves) are fine; pathologically large trees slow ESLint config matching.
