# eslint-plugin-templates

[![npm](https://img.shields.io/npm/v/eslint-plugin-templates.svg)](https://www.npmjs.com/package/eslint-plugin-templates)
[![CI](https://img.shields.io/github/actions/workflow/status/TerryTsai/eslint-plugin-templates/ci.yml?branch=main)](https://github.com/TerryTsai/eslint-plugin-templates/actions)
[![License: MIT](https://img.shields.io/npm/l/eslint-plugin-templates.svg)](./LICENSE)

ESLint plugin for matching files against declarative templates. You describe what a file should look like; the linter enforces that shape across your codebase. Useful where similar files share a structure — feature folders, route handlers, reducers.

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
      body: "${IMPORTS}\n${HANDLER}",
      slots: {
        IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
        HANDLER: { type: "FunctionDeclaration", exported: true, async: true },
      },
    }],
  },
}];
```

Every file in `src/handlers/` must be zero or more imports followed by one exported async function. Anything else — a stray `const`, a second function, a top-level `console.log` — fails the lint.

`body` uses `${SLOT}` placeholders for the parts that vary. Pass it as a regular string, not a JavaScript template literal — `` `${SLOT}` `` would interpolate at config-load time.

## Rules

Two rules. Templates describe what's allowed; `forbid` rejects what isn't.

- **`templates/match`** — match a file against a template
- **`templates/forbid`** — reject every file the rule's glob covers

## `templates/match`

The rule's options are the template:

```ts
type MatchTemplate = {
  id: string;
  body: string;
  slots?: Record<string, Slot>;
};
```

The matcher walks the template's AST against the file's AST in lockstep. Literal AST in the template must match exactly; `${SLOT}` placeholders in the body consume zero or more file nodes per the slot's type, cardinality, and refinements. Anything in the file not accounted for fails the lint.

### Slot variants

Five variants, each typed by AST kind with its own refinements:

| Variant | `type` values | Refinements |
|---|---|---|
| `ImportSlot` | `ImportDeclaration` | `typeOnly`, `fromPath`, `named` |
| `FunctionSlot` | `FunctionDeclaration`, `ArrowFunction`, `FunctionExpression`, `MethodDeclaration`, `MethodSignature` | `async`, `arity`, `returnsKind`, `exported`, `default`, `named` |
| `PropertySlot` | `PropertyAssignment`, `PropertySignature`, `PropertyDeclaration` | `valueKind`, `optional`, `readonly`, `named` |
| `LiteralSlot` | `StringLiteral`, `NumericLiteral` | `matches`, `named` |
| `AnySlot` | any other kind, or array of kinds | `named` |

`AnySlot` is the fallback for kinds without specialized refinements (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) and for matching multiple kinds at once via array `type`. The schema rejects cross-variant mismatches at config-load time — an `ImportSlot` with an `arity` field, for example, won't validate.

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

Export-wrapper transparency: `{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`. Filter with `exported`/`default`. To match the wrapper itself, use `{ type: "ExportNamedDeclaration" }` via `AnySlot`.

### Cardinality

| Configuration | Meaning |
|---|---|
| neither set | exactly 1 |
| `minOccurs: 0` only | 0 or more |
| `minOccurs: N` only (N ≥ 1) | N or more |
| `maxOccurs: M` only | up to M, default min 1 |
| both | between min and max, inclusive |

### Cross-position binding

The same `${NAME}` placeholder in multiple inline positions unifies on the file's identifier:

```js
body: "function ${NAME}() {}\nexport { ${NAME} };"
```

`function foo() {} export { foo };` matches. `function foo() {} export { bar };` triggers `bindingMismatch`.

### Diagnostics

| `messageId` | When |
|---|---|
| `divergence` | A literal template node and the file's node have different shapes |
| `missingRequired` | A slot's `minOccurs` couldn't be satisfied |
| `refinementFailed` | A node matched the slot's kind but failed a refinement |
| `bindingMismatch` | A `${NAME}` placeholder used in two positions resolved to different identifiers |
| `extraContent` | The file has trailing content the template doesn't account for |
| `unknownSlot` | The body references `${X}` but `slots.X` isn't declared |

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

Combining `match` for content rules with `forbid` for the allow-list:

```js
import templates from "eslint-plugin-templates";
import tsParser from "@typescript-eslint/parser";

const base = { languageOptions: { parser: tsParser }, plugins: { templates } };

export default [
  // Handlers: imports, then one exported async function named handle*
  {
    ...base,
    files: ["src/services/*/handler-*.ts"],
    rules: {
      "templates/match": ["error", {
        id: "service-handler",
        body: "${IMPORTS}\n${HANDLER}",
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

  // types.ts: only interfaces and type aliases
  {
    ...base,
    files: ["src/services/*/types.ts"],
    rules: {
      "templates/match": ["error", {
        id: "service-types",
        body: "${TYPES}",
        slots: {
          TYPES: {
            type: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
            minOccurs: 1,
          },
        },
      }],
    },
  },

  // Anything else in a service folder is rejected
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

## Limitations

- One template per `templates/match` rule invocation. Use multiple ESLint config blocks with different `files` globs to apply different templates to different parts of the codebase.
- No autofix.
- No type-resolved checks; everything is syntactic.
- `templates/forbid` only sees files ESLint lints. To catch non-JS/TS files (`*.md`, `*.json`, etc.), extend ESLint's parser configuration to those file types.

## License

MIT
