# `templates/match`

Match a file's whole-program shape against a declared template. Files matched by the rule's `files` glob must structurally match the template body, with `{{SLOT}}` placeholders standing in for the parts that vary.

## Body composition

The `body` is parsed as TypeScript. Three building blocks combine:

### Statement-level placeholders

`{{SLOT}}` on its own line consumes file statements per the slot's `type`, cardinality, and refinements.

```js
body: `
  {{IMPORTS}}
  {{EXPORTED}}
`
```

### Literal AST

Non-placeholder code in the body must appear in the file as-is. Source location is ignored; everything else is compared.

```js
body: `
  import { useState } from "react";
  {{HOOKS}}
`
```

The file must start with that exact import, then satisfy `HOOKS`.

A body with no placeholders requires an exact-shape file:

```js
body: "export const VERSION = '1.0.0';"
```

### Inline placeholders

`{{NAME}}` in an expression or identifier position binds to the Identifier in that position. A later `{{NAME}}` must agree, or `bindingMismatch` fires.

```js
body: `
  function {{NAME}}() {}
  export { {{NAME}} };
`
```

`function foo() {} export { foo };` matches. `function foo() {} export { bar };` triggers `bindingMismatch`.

A literal shell with an inline placeholder lets you constrain everything *but* the name:

```js
body: "export function {{NAME}}() { return null; }"
```

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

`exported`/`default` check the export wrapper; other refinements check the unwrapped declaration. So `{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`.

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

Fallback for kinds without specialized refinements (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) and for matching multiple kinds via array `type`.

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

The same `{{NAME}}` placeholder in multiple inline expression positions unifies on the file's identifier:

```js
body: `
  function {{NAME}}() {}
  export { {{NAME}} };
`
```

`function foo() {} export { foo };` matches. `function foo() {} export { bar };` triggers `bindingMismatch`.

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

Other kinds (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.) pass through the AST `type` directly via `AnySlot`.

## Export wrappers

`{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`. Filter with `exported`/`default`:

| Refinement | Matches |
|---|---|
| no refinement | either form |
| `exported: true` | only `export function …` (named or default) |
| `default: true` | only `export default function …` |
| `exported: false` | only the non-exported form |

To match the wrapper itself, use `{ type: "ExportNamedDeclaration" }` via `AnySlot`.

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

- One template per rule invocation. Use multiple ESLint config blocks with different `files` globs to apply different templates to different parts of the codebase.
- Cross-position binding only applies to inline placeholders. The same statement-level `{{SLOT}}` consumed twice doesn't unify; use distinct names.
- No autofix.
- No type-resolved checks; everything is syntactic.

## Authoring tips

- Slot names must be uppercase letters, digits, and underscores (the placeholder regex is `[A-Z_][A-Z0-9_]*`).
- The same `{{NAME}}` in multiple inline positions unifies. Use distinct names for separate slots.
