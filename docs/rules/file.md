# `templates/file`

Enforce that a file's whole-program shape matches a declared template. Files matched by the rule's ESLint `files` glob must structurally match the template body, modulo declared `${VARIABLES}`.

## How matching works

1. The rule parses the template body once (cached per template object).
2. For each file ESLint hands the rule, the matcher walks the template's `Program.body` against the file's `Program.body` in lockstep.
3. At each position, the template either has a `${VAR}` placeholder (variable consumption) or a literal AST node (must match exactly).
4. `${VAR}` consumes zero or more file nodes per the variable's `type`, `minOccurs`/`maxOccurs`, and refinements.
5. If the walk completes with all constraints satisfied → match. Otherwise → diagnostic at the divergence point.

The matcher is **whole-file**: any file content not accounted for by the template fails the lint.

## Configuration shape

```ts
type FileTemplate = {
  id: string;                                // identifier for diagnostics
  body: string;                              // template body with ${VAR} placeholders
  description?: string;
  message?: string;
  severity?: "error" | "warning" | "info";
  variables?: Record<string, Variable>;
};

type Variable =
  | ImportVariable
  | FunctionVariable
  | PropertyVariable
  | LiteralVariable
  | AnyVariable;
```

All variants share base fields:

```ts
type BaseVariable = {
  minOccurs?: number;          // default: 1 (or 0 if maxOccurs is set without minOccurs)
  maxOccurs?: number;          // default: 1 if minOccurs absent, else unbounded
  named?: string | RegExp;     // matches against the node's identifier name
  body?: string;               // for nested templates (not yet implemented)
  variables?: Record<string, Variable>;
};
```

## Variants and refinements

### `ImportVariable`

```ts
type ImportVariable = BaseVariable & {
  type: "ImportDeclaration";
  typeOnly?: boolean;          // requires `import type { ... }` syntax
  fromPath?: string;           // exact match against the import source
};
```

**Example:**

```js
REACT_TYPES: {
  type: "ImportDeclaration",
  typeOnly: true,
  fromPath: "react",
  minOccurs: 1,
}
```

### `FunctionVariable`

```ts
type FunctionVariable = BaseVariable & {
  type:
    | "FunctionDeclaration"
    | "ArrowFunction"
    | "FunctionExpression"
    | "MethodDeclaration"
    | "MethodSignature";
  async?: boolean;
  arity?: number;              // exact parameter count
  returnsKind?: NodeKind | NodeKind[];  // matches return-type-annotation kind
  exported?: boolean;          // wrapped in ExportNamedDeclaration
  default?: boolean;           // wrapped in ExportDefaultDeclaration
};
```

`exported`/`default` are checked against the export wrapper. The function's other refinements (`named`, `async`, etc.) are checked against the unwrapped declaration — `{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}` transparently.

**Example:**

```js
HANDLER: {
  type: "FunctionDeclaration",
  exported: true,
  async: true,
  named: /^handle[A-Z]/,
  arity: 2,
}
```

### `PropertyVariable`

```ts
type PropertyVariable = BaseVariable & {
  type: "PropertyAssignment" | "PropertySignature" | "PropertyDeclaration";
  valueKind?: NodeKind | NodeKind[];   // matches the property's value kind
  optional?: boolean;          // `foo?: string` style
  readonly?: boolean;
};
```

- `PropertyAssignment` — object literal property (`{ key: value }`).
- `PropertySignature` — interface/type property (`interface I { foo: string }`).
- `PropertyDeclaration` — class property (`class C { foo = 1 }`).

**Example:**

```js
TYPED_KEY: {
  type: "PropertyAssignment",
  named: "name",
  valueKind: "Literal",
}
```

### `LiteralVariable`

```ts
type LiteralVariable = BaseVariable & {
  type: "StringLiteral" | "NumericLiteral";
  matches?: RegExp;            // tested against String(value)
};
```

**Example:**

```js
ROUTE_PATH: {
  type: "StringLiteral",
  matches: /^\/api\//,
}
```

### `AnyVariable`

```ts
type AnyVariable = BaseVariable & {
  type: NodeKind | NodeKind[];   // any kind not covered by a specialized variant
};
```

The fallback for kinds without specialized refinements (e.g. `ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`). Accepts only the base refinements (`named`, cardinality).

When `type` is a single string that is one of the specialized variants' kinds, the schema requires you to use the matching specialized variant. To match a kind not handled by a specialized variant, use a single string. To match multiple kinds at once, use an array — the array form falls through to `AnyVariable`.

**Example:**

```js
TYPES: {
  type: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
  minOccurs: 1,
  maxOccurs: 50,
}
```

## Refinement summary

| Refinement | Variant(s) | Type | What it checks |
|---|---|---|---|
| `named` | all | `string \| RegExp` | The node's identifier name (`id.name`, `key.name`, computed string key) |
| `typeOnly` | `ImportVariable` | `boolean` | `importKind === "type"` |
| `fromPath` | `ImportVariable` | `string` | Exact match on `source.value` |
| `async` | `FunctionVariable` | `boolean` | `async` flag |
| `arity` | `FunctionVariable` | `number` | `params.length` |
| `returnsKind` | `FunctionVariable` | `NodeKind \| NodeKind[]` | Kind of `returnType.typeAnnotation` |
| `exported` | `FunctionVariable` | `boolean` | Wrapped in `ExportNamedDeclaration` |
| `default` | `FunctionVariable` | `boolean` | Wrapped in `ExportDefaultDeclaration` |
| `valueKind` | `PropertyVariable` | `NodeKind \| NodeKind[]` | Kind of `value` |
| `optional` | `PropertyVariable` | `boolean` | `optional` flag |
| `readonly` | `PropertyVariable` | `boolean` | `readonly` flag |
| `matches` | `LiteralVariable` | `RegExp` | Tested against `String(value)` |

## Cardinality

| Configuration | Meaning |
|---|---|
| no `minOccurs` or `maxOccurs` | Exactly 1 |
| `minOccurs: 0` only | 0 or more (unbounded above) |
| `minOccurs: N` only (N ≥ 1) | N or more (unbounded above) |
| `maxOccurs: M` only | At most M, defaulting to ≥ 1 minimum |
| both | Between min and max, inclusive |

## Cross-position binding

When the same `${NAME}` placeholder appears in multiple inline expression positions, the matcher unifies them. The first occurrence binds the placeholder to the file's identifier; subsequent occurrences must match.

```js
body: "function ${NAME}() {}\nexport { ${NAME} };"
```

A file with `function foo() {} export { foo };` matches. A file with `function foo() {} export { bar };` triggers `bindingMismatch`.

Statement-level cross-binding (using the same placeholder twice as a statement) is not enforced in v0 — use unique placeholder names for separate statement-level slots.

## Supported node kinds

The `type` field uses logical kind names. Most align with TypeScript's `SyntaxKind`. The matcher translates them to the underlying `@typescript-eslint/typescript-estree` AST `type` values:

| Logical kind | AST `type` | Notes |
|---|---|---|
| `ImportDeclaration` | `ImportDeclaration` | |
| `FunctionDeclaration` | `FunctionDeclaration` | |
| `ArrowFunction` | `ArrowFunctionExpression` | |
| `FunctionExpression` | `FunctionExpression` | |
| `MethodDeclaration` | `MethodDefinition` | Class methods |
| `MethodSignature` | `TSMethodSignature` | Interface methods |
| `PropertyAssignment` | `Property` | Object literal entries |
| `PropertySignature` | `TSPropertySignature` | Interface/type properties |
| `PropertyDeclaration` | `PropertyDefinition` | Class fields |
| `StringLiteral` | `Literal` (string value) | |
| `NumericLiteral` | `Literal` (number value) | |

For other kinds (`ClassDeclaration`, `TSInterfaceDeclaration`, `VariableDeclaration`, etc.), pass the AST `type` value directly via `AnyVariable`.

## Export-wrapper transparency

`{ type: "FunctionDeclaration" }` matches both `function foo() {}` and `export function foo() {}`. Use the `exported` / `default` refinements to filter on the wrapper:

- No refinement → matches either.
- `exported: true` → only `export function …` (named or default).
- `default: true` → only `export default function …`.
- `exported: false` → only the non-exported form.

If you specifically want to match the wrapper itself (e.g. `ExportNamedDeclaration` as a node), use `{ type: "ExportNamedDeclaration" }` directly via `AnyVariable`.

## Diagnostic messages

| `messageId` | Message template |
|---|---|
| `divergence` | `File diverges from template "{templateId}": expected {expected} at this position, found {found}.` |
| `missingRequired` | `File diverges from template "{templateId}": expected at least {minOccurs} {type} node(s) for "{name}", found {found}.` |
| `refinementFailed` | `File diverges from template "{templateId}": "{name}" expects {type} matching refinement "{refinement}".` |
| `bindingMismatch` | `File diverges from template "{templateId}": "{name}" was bound to "{bound}" earlier but found "{got}" here.` |
| `extraContent` | `File diverges from template "{templateId}": unexpected {found} after the last template position.` |
| `unknownVariable` | `Template "{templateId}" references variable "{name}" that is not declared in `variables`.` |

## Limitations

- **One template per rule invocation.** Use multiple ESLint config blocks with different `files` globs to apply different templates to different parts of the codebase. The rule does not have its own scoping mechanism.
- **No nested templates.** The handoff design allows a `Variable` to carry its own `body`/`variables`, but the matcher does not yet recurse into them. Track this as a v0 follow-up.
- **No statement-level cross-binding.** Cross-position binding works for inline placeholders inside other AST nodes, not for statement-level placeholders that consume multiple nodes.
- **No autofix.** Diagnostics report the divergence point, but the rule cannot rewrite the file.
- **No type-resolved checks.** All checks are syntactic — `returnsKind: "TSStringKeyword"` matches the literal type annotation, not type inference.

## Authoring tips

- **Always use regular strings for the body, not template literals.** `"${IMPORTS}"` is correct; `` `${IMPORTS}` `` interpolates at JS-parse time.
- **Names appearing multiple times unify.** Use the same `${NAME}` to bind a function name to its export reference. Use distinct names (`${NAME1}`, `${NAME2}`) for separate slots.
- **Variable names are case-sensitive and uppercase by convention.** The placeholder regex requires `[A-Z_][A-Z0-9_]*` — `${myVar}` is not a placeholder.
- **Test templates in isolation first.** Apply the rule to a single representative file via the `files` glob, iterate on the template, then expand the scope.
