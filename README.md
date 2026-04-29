# eslint-plugin-templates

[![npm](https://img.shields.io/npm/v/eslint-plugin-templates.svg)](https://www.npmjs.com/package/eslint-plugin-templates)
[![CI](https://img.shields.io/github/actions/workflow/status/TerryTsai/eslint-plugin-templates/ci.yml?branch=main)](https://github.com/TerryTsai/eslint-plugin-templates/actions)
[![License: MIT](https://img.shields.io/npm/l/eslint-plugin-templates.svg)](./LICENSE)

ESLint plugin for matching files against declarative templates. Describe what a file should look like; the linter enforces that shape across your codebase. Useful where similar files share a structure — feature folders, route handlers, reducers.

## Install

```sh
npm install --save-dev eslint eslint-plugin-templates @typescript-eslint/parser
```

Requires ESLint 8 or later.

## Quick start

```js
// eslint.config.js
import templates from "eslint-plugin-templates";
import tsParser from "@typescript-eslint/parser";

export default [{
  files: ["src/handlers/*.ts"],
  languageOptions: { parser: tsParser },
  plugins: { templates },
  rules: {
    "templates/match": ["error", {
      id: "handler",
      body: `
        {{IMPORTS}}
        {{HANDLER}}
      `,
      slots: {
        IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
        HANDLER: { type: "FunctionDeclaration", exported: true, async: true },
      },
    }],
  },
}];
```

Every file in `src/handlers/` must be zero or more imports followed by one exported async function. Anything else fails the lint.

## Body

The `body` is parsed as TypeScript. Three building blocks combine:

- **Statement-level placeholders** — `{{SLOT}}` on its own line consumes file statements per the slot's type, cardinality, and refinements.
- **Literal AST** — non-placeholder code must appear in the file as-is.
- **Inline placeholders** — `{{NAME}}` in an expression or identifier position binds to the Identifier in that position. A later `{{NAME}}` must agree, or `bindingMismatch` fires.

```js
{
  id: "express-resource",
  body: `
    import express from "express";
    {{IMPORTS}}

    export const router = express.Router();

    {{ROUTES}}

    {{HANDLERS}}
  `,
  slots: {
    IMPORTS:  { type: "ImportDeclaration",  minOccurs: 0, maxOccurs: 10 },
    ROUTES:   { type: "ExpressionStatement", minOccurs: 1, maxOccurs: 20 },
    HANDLERS: { type: "FunctionDeclaration", async: true, arity: 2, minOccurs: 1 },
  },
}
```

Files must:

- Start with `import express from "express";`.
- Have zero or more additional imports.
- Have `export const router = express.Router();`.
- Register one or more routes (any expression statement).
- Declare one or more async function handlers, each taking two parameters.

Indentation, blank lines, and comments in the body are ignored.

**Cross-position binding.** The same `{{NAME}}` placeholder in multiple inline positions must resolve to the same identifier:

```js
{
  id: "exported-fn",
  body: `
    function {{NAME}}() {}
    export { {{NAME}} };
  `,
}
```

`function listUsers() {} export { listUsers };` matches. `function listUsers() {} export { fetchUsers };` triggers `bindingMismatch`.

## Rules

- **`templates/match`** — match a file against a template
- **`templates/forbid`** — reject every file the rule's glob covers

## `templates/match`

```ts
type MatchTemplate = {
  id: string;
  body: string;
  slots?: Record<string, Slot>;
};
```

### Slot variants

| Variant | `type` values | Refinements |
|---|---|---|
| `ImportSlot` | `ImportDeclaration` | `typeOnly`, `fromPath`, `named` |
| `FunctionSlot` | `FunctionDeclaration`, `ArrowFunction`, `FunctionExpression`, `MethodDeclaration`, `MethodSignature` | `async`, `arity`, `returnsKind`, `exported`, `default`, `named` |
| `PropertySlot` | `PropertyAssignment`, `PropertySignature`, `PropertyDeclaration` | `valueKind`, `optional`, `readonly`, `named` |
| `LiteralSlot` | `StringLiteral`, `NumericLiteral` | `matches`, `named` |
| `AnySlot` | any other kind, or array of kinds | `named` |

`AnySlot` covers kinds without specialized refinements (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) and matches multiple kinds via an array `type`. The schema rejects cross-variant refinements (e.g. `arity` on an `ImportSlot`) at config-load time.

### Refinements

| Refinement | Variant | Type | Checks |
|---|---|---|---|
| `named` | all | `string \| RegExp` | The node's identifier name |
| `typeOnly` | `ImportSlot` | `boolean` | `import type { … }` syntax |
| `fromPath` | `ImportSlot` | `string` | Exact match on import source |
| `async` | `FunctionSlot` | `boolean` | The `async` flag |
| `arity` | `FunctionSlot` | `number` | `params.length` |
| `returnsKind` | `FunctionSlot` | `NodeKind \| NodeKind[]` | The kind of `returnType.typeAnnotation` |
| `exported` | `FunctionSlot` | `boolean` | Wrapped in `ExportNamedDeclaration` |
| `default` | `FunctionSlot` | `boolean` | Wrapped in `ExportDefaultDeclaration` |
| `valueKind` | `PropertySlot` | `NodeKind \| NodeKind[]` | The kind of the property's value |
| `optional` | `PropertySlot` | `boolean` | The `optional` flag |
| `readonly` | `PropertySlot` | `boolean` | The `readonly` flag |
| `matches` | `LiteralSlot` | `RegExp` | The literal value |

`{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`. Filter with `exported`/`default`. To match the wrapper itself, use `{ type: "ExportNamedDeclaration" }` via `AnySlot`.

### Cardinality

| Configuration | Meaning |
|---|---|
| neither set | exactly 1 |
| `minOccurs: 0` only | 0 or more |
| `minOccurs: N` only (N ≥ 1) | N or more |
| `maxOccurs: M` only | up to M, default min 1 |
| both | between min and max, inclusive |

### Diagnostics

| `messageId` | When |
|---|---|
| `divergence` | A literal template node and the file's node have different shapes |
| `missingRequired` | A slot's `minOccurs` couldn't be satisfied |
| `refinementFailed` | A node matched the slot's kind but failed a refinement |
| `bindingMismatch` | A `{{NAME}}` placeholder used in two positions resolved to different identifiers |
| `extraContent` | The file has trailing content the template doesn't account for |
| `unknownSlot` | The body references `{{X}}` but `slots.X` isn't declared |

[Full reference →](./docs/rules/match.md)

## `templates/forbid`

Always emits a diagnostic on the file. Pair with ESLint's `ignores` to allow-list specific files and reject everything else:

```js
{
  files: ["src/services/*/*.ts"],
  ignores: [
    "src/services/*/index.ts",
    "src/services/*/types.ts",
    "src/services/*/handler-*.ts",
  ],
  rules: {
    "templates/forbid": ["error", {
      message: "Service folders only contain index.ts, types.ts, and handler-*.ts.",
    }],
  },
}
```

```ts
type ForbidOptions = { message?: string };
```

Default message: `"This file is not allowed in the current scope."`.

[Full reference →](./docs/rules/forbid.md)

## Composing the rules

```js
import templates from "eslint-plugin-templates";
import tsParser from "@typescript-eslint/parser";

const base = { languageOptions: { parser: tsParser }, plugins: { templates } };

export default [
  {
    ...base,
    files: ["src/services/*/handler-*.ts"],
    rules: {
      "templates/match": ["error", {
        id: "service-handler",
        body: `
          {{IMPORTS}}
          {{HANDLER}}
        `,
        slots: {
          IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
          HANDLER: {
            type: "FunctionDeclaration",
            exported: true,
            async: true,
            named: /^handle/,
          },
        },
      }],
    },
  },

  {
    ...base,
    files: ["src/services/*/types.ts"],
    rules: {
      "templates/match": ["error", {
        id: "service-types",
        body: "{{TYPES}}",
        slots: {
          TYPES: {
            type: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
            minOccurs: 1,
          },
        },
      }],
    },
  },

  {
    ...base,
    files: ["src/services/*/*.ts"],
    ignores: [
      "src/services/*/handler-*.ts",
      "src/services/*/types.ts",
      "src/services/*/index.ts",
    ],
    rules: {
      "templates/forbid": ["error", {
        message: "Service folders only contain handler-*.ts, types.ts, and index.ts.",
      }],
    },
  },
];
```

## Modules

For codebases where many folders share the same shape, `eslint-plugin-templates/config` describes the layout once with `defineModule` and applies it with `applyModule`:

```js
import { applyModule, defineModule } from "eslint-plugin-templates/config";
import tsParser from "@typescript-eslint/parser";

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
  closed: { message: "API resources contain only router, controller, service, model, validation, and tests." },
});

export default [
  ...applyModule({ module: apiResourceModule, root: "src/api/*", parser: tsParser }),
  ...applyModule({ module: apiResourceModule, root: "apps/*/api/*", parser: tsParser }),
];
```

`applyModule` expands the tree into one ESLint config block per entry, orders sibling globs by specificity (most-specific wins), and emits a `templates/forbid` block for the folder when `closed` is set.

Tree conventions:

- Keys ending in `/` are folders; their value is a nested tree (or another `defineModule` for folder-local options).
- Keys without `/` are files — literal names (`"index.ts"`) or single-folder globs (`"*.ts"`, `"*.test.ts"`).
- Multi-segment keys (`"a/b/c.ts"`) and `**` are rejected; nest folders explicitly.

`closed: true` (or `closed: { message, extensions }`) rejects any file in *that* folder not matched by a direct entry. Nested folders own their own scope. Default extensions are `["ts"]`.

[Full reference →](./docs/modules.md)

## Limitations

- One template per `templates/match` rule invocation. Use multiple ESLint config blocks (or a module) with different `files` globs to apply different templates to different parts of the codebase.
- Modules can reject unwanted files (with `closed`) but can't require missing files to exist.
- No autofix.
- No type-resolved checks; everything is syntactic.
- `templates/forbid` only sees files ESLint lints. To catch non-JS/TS files (`*.md`, `*.json`, etc.), extend ESLint's parser configuration to those file types.

## License

MIT
