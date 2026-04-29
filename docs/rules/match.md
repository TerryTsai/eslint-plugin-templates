# `templates/match`

Enforce that a file's whole-program shape matches a declared template. Files matched by ESLint's `files` glob must structurally match the template body, modulo declared `${SLOT}` placeholders.

## How matching works

The template body is parsed once per template object. For each file ESLint hands the rule, the matcher walks the template's `Program.body` against the file's `Program.body` in lockstep:

- Literal AST in the template must match exactly.
- `${SLOT}` placeholders consume zero or more file nodes per the slot's `type`, cardinality, and refinements.

The match is whole-file. Anything in the file not accounted for by the template fails the lint.

## Body composition

The `body` is parsed as TypeScript. Anything valid in TS is valid in a body, and three building blocks combine to describe a file's shape:

### Statement-level placeholders

`${SLOT}` on its own line consumes one or more file statements according to the slot's `type`, cardinality, and refinements.

```js
body: "${IMPORTS}\n${EXPORTED}"
```

### Literal AST

Anything that isn't a placeholder is literal — it must appear in the file with the same AST shape. Source location is ignored, but every other field is compared.

```js
body: 'import { useState } from "react";\n${HOOKS}'
```

The file must start with that exact import (wrong source path, missing or extra specifier all fail with `divergence`), then satisfy `HOOKS`.

A body with no placeholders at all is valid — it requires an exact-shape file:

```js
body: "export const VERSION = '1.0.0';"
```

### Inline placeholders

`${NAME}` in an expression or identifier position (anywhere other than a top-level statement) becomes a binding hole. The first occurrence accepts whatever Identifier sits there in the file; later occurrences must agree, or `bindingMismatch` fires.

```js
body: "function ${NAME}() {}\nexport { ${NAME} };"
```

`function foo() {} export { foo };` matches. `function foo() {} export { bar };` triggers `bindingMismatch`.

A literal shell with an inline name placeholder lets you constrain everything *but* the name:

```js
body: "export function ${NAME}() { return null; }"
```

That requires the file to be exactly an exported function returning `null` — only the function's name varies.

### Combining them

Mix freely. The matcher resolves each template top-level statement as either a placeholder (treated per slot rules) or as literal AST (deep-compared, with inline placeholders unifying):

```js
body: 'import { useState } from "react";\n${HOOKS}\nexport function ${NAME}() {}'
```

Required: the exact import, one or more `HOOKS` statements, then a literal `export function () {}` shell with `${NAME}` bound to whatever the file names it.

## Configuration

```ts
type MatchTemplate = {
  id: string;
  body: string;
  slots?: Record<string, Slot>;
};
```

All slot variants share base fields:

```ts
type BaseSlot = {
  minOccurs?: number;
  maxOccurs?: number;
  named?: string | RegExp;
};
```

## Variants

The `Slot` union has five variants, each with refinements appropriate to its AST kind.

### `ImportSlot`

```ts
type ImportSlot = BaseSlot & {
  type: "ImportDeclaration";
  typeOnly?: boolean;
  fromPath?: string;
};
```

`{ type: "ImportDeclaration", typeOnly: true, fromPath: "react" }` matches `import type { … } from "react"`.

### `FunctionSlot`

```ts
type FunctionSlot = BaseSlot & {
  type:
    | "FunctionDeclaration"
    | "ArrowFunction"
    | "FunctionExpression"
    | "MethodDeclaration"
    | "MethodSignature";
  async?: boolean;
  arity?: number;
  returnsKind?: NodeKind | NodeKind[];
  exported?: boolean;
  default?: boolean;
};
```

`exported`/`default` consult the export wrapper around the function. Other refinements apply to the unwrapped declaration, so `{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}` transparently.

`{ type: "FunctionDeclaration", exported: true, async: true, named: /^handle/ }` matches `export async function handleX() { … }`.

### `PropertySlot`

```ts
type PropertySlot = BaseSlot & {
  type: "PropertyAssignment" | "PropertySignature" | "PropertyDeclaration";
  valueKind?: NodeKind | NodeKind[];
  optional?: boolean;
  readonly?: boolean;
};
```

- `PropertyAssignment` — object literal entries (`{ key: value }`)
- `PropertySignature` — interface/type properties
- `PropertyDeclaration` — class fields

### `LiteralSlot`

```ts
type LiteralSlot = BaseSlot & {
  type: "StringLiteral" | "NumericLiteral";
  matches?: RegExp;
};
```

`matches` is tested against `String(node.value)`.

### `AnySlot`

```ts
type AnySlot = BaseSlot & {
  type: NodeKind | NodeKind[];
};
```

The fallback for kinds without specialized refinements (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) and for matching multiple kinds at once via array `type`.

## Refinements

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

## Cardinality

| Configuration | Meaning |
|---|---|
| neither set | exactly 1 |
| `minOccurs: 0` only | 0 or more |
| `minOccurs: N` only (N ≥ 1) | N or more |
| `maxOccurs: M` only | up to M, default min 1 |
| both | between min and max, inclusive |

## Cross-position binding

When the same `${NAME}` placeholder appears in multiple inline expression positions, the matcher unifies them. The first occurrence binds the placeholder to the file's identifier; subsequent occurrences must agree.

```js
body: "function ${NAME}() {}\nexport { ${NAME} };"
```

`function foo() {} export { foo };` matches. `function foo() {} export { bar };` triggers `bindingMismatch`.

Statement-level cross-binding (the same placeholder consumed twice as a top-level statement) is not supported in v0 — use distinct placeholder names for separate statement-level slots.

## Supported node kinds

Logical kind names map to TSESTree AST `type` values:

| Logical kind | AST `type` |
|---|---|
| `ImportDeclaration` | `ImportDeclaration` |
| `FunctionDeclaration` | `FunctionDeclaration` |
| `ArrowFunction` | `ArrowFunctionExpression` |
| `FunctionExpression` | `FunctionExpression` |
| `MethodDeclaration` | `MethodDefinition` |
| `MethodSignature` | `TSMethodSignature` |
| `PropertyAssignment` | `Property` |
| `PropertySignature` | `TSPropertySignature` |
| `PropertyDeclaration` | `PropertyDefinition` |
| `StringLiteral` | `Literal` (string value) |
| `NumericLiteral` | `Literal` (number value) |

Other kinds (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) pass through the AST `type` value directly via `AnySlot`.

## Export-wrapper transparency

`{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`. Filter with the `exported` and `default` refinements:

| Refinement | Matches |
|---|---|
| no refinement | either form |
| `exported: true` | only `export function …` (named or default) |
| `default: true` | only `export default function …` |
| `exported: false` | only the non-exported form |

To match the export wrapper itself, use `{ type: "ExportNamedDeclaration" }` via `AnySlot`.

## Diagnostics

| `messageId` | Message |
|---|---|
| `divergence` | `File diverges from template "{templateId}": expected {expected} at this position, found {found}.` |
| `missingRequired` | `File diverges from template "{templateId}": expected at least {minOccurs} {type} node(s) for "{name}", found {found}.` |
| `refinementFailed` | `File diverges from template "{templateId}": "{name}" expects {type} matching refinement "{refinement}".` |
| `bindingMismatch` | `File diverges from template "{templateId}": "{name}" was bound to "{bound}" earlier but found "{got}" here.` |
| `extraContent` | `File diverges from template "{templateId}": unexpected {found} after the last template position.` |
| `unknownSlot` | `Template "{templateId}" references slot "{name}" that is not declared in `slots`.` |

## Limitations

- One template per rule invocation — use multiple ESLint config blocks with different `files` globs to apply different templates to different parts of the codebase.
- No statement-level cross-binding.
- No autofix.
- No type-resolved checks; everything is syntactic.

## Authoring tips

- Use a regular string for `body`, never a JS template literal. `"${SLOT}"` is a placeholder; `` `${SLOT}` `` interpolates at JS-parse time.
- Slot names are uppercase by convention (the placeholder regex is `[A-Z_][A-Z0-9_]*`).
- The same `${NAME}` in multiple inline positions unifies. Use distinct names for separate slots.
