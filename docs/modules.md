# Modules

Declare an ESLint configuration for a folder shape as a single tree, then apply it at one or more roots.

## When to reach for it

Use a module when you'd otherwise write multiple `templates/match` (and `templates/forbid`) config blocks for the same folder shape. Stick with raw `templates/match` for a single template applied to a single glob.

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
  parser: Parser;                        // ESLint parser module (e.g. @typescript-eslint/parser)
  parserOptions?: Record<string, unknown>;
};
```

## Tree conventions

- **Folder keys** end in `/` — `"kinds/"`, `"refinements/"`. Their value is another `Tree` or a `Module`.
- **File keys** have no `/` — literal names (`"index.ts"`) or single-folder globs (`"*.ts"`, `"*.test.ts"`). Their value is a `MatchTemplate`.
- **Multi-segment keys** (`"a/b/c.ts"`) and **`**`** are rejected. Nest folders explicitly.

Violations throw at `defineModule` with a message naming the offending key path.

## Sibling glob precedence

Within a folder, sibling keys may overlap. `applyModule` orders them by specificity:

- Fewer wildcards is more specific.
- Among ties, more literal characters is more specific.

`{ "*.ts": A, "*.test.ts": B, "index.ts": C }` emits in order `*.ts` → `*.test.ts` → `index.ts`. For `index.ts`, all three match; `templates/match` from the `index.ts` block wins. Insertion order does not matter.

## Closed scope

`closed: true` (or `closed: { message, extensions }`) emits a `templates/forbid` block over the folder. Any file with one of the listed extensions that isn't matched by a direct entry triggers the diagnostic.

Defaults:
- `message`: `"This file is not allowed in the current scope."`
- `extensions`: `["ts"]`

`closed` propagates: a parent's `closed` applies to all descendant folders unless one declares its own. Set it once at the top of the tree and the whole subtree is locked. A nested module's `closed` overrides the inherited value (different message, different extensions, etc.).

It only fires on files ESLint actually lints. It rejects unwanted files but doesn't require expected ones to exist.

## Nesting

A folder value can be a plain `Tree` or another `defineModule` (for folder-local options like `closed`):

```js
const apiResourceModule = defineModule({
  contents: {
    "router.ts": routerTemplate,
    "controller.ts": controllerTemplate,
    "service.ts": serviceTemplate,
    "model.ts": modelTemplate,
    "validation/": defineModule({
      closed: true,
      contents: {
        "schema.ts": schemaTemplate,
        "validators/": { "*.ts": validatorTemplate },
      },
    }),
    "*.test.ts": testTemplate,
  },
});
```

## Reuse across roots

```js
export default [
  ...applyModule({ module: apiResourceModule, root: "src/api/*", parser: tsParser }),
  ...applyModule({ module: apiResourceModule, root: "apps/*/api/*", parser: tsParser }),
];
```

`root` itself can be a glob — `"src/api/*"` means "every direct child of `src/api/`."

## Block names

Each emitted block carries a `name` identifying its position in the tree:

- Match blocks: `"templates:<template.id>@<glob>"`, e.g. `"templates:api-router@src/api/users/router.ts"`
- Forbid blocks: `"templates:closed@<path>"`, e.g. `"templates:closed@src/api/users"`

Run `npx eslint --print-config <file>` to see which named block applied to a given file.

## Limitations

- Modules can reject unwanted files (with `closed`) but can't require missing files to exist.
- One template per file. Combine constraints in a single template if needed.
- Two `applyModule` calls covering the same file path both emit blocks; ESLint's last-wins semantics applies.
