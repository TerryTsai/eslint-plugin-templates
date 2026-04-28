# eslint-plugin-templates

> ESLint plugin that enforces structural conformance of files against declarative templates.

Files matched by a configured glob must structurally match a template's body, modulo named variables. The template *is* the canonical example of what a conforming file looks like — reading the template tells the author (or AI agent) exactly what shape the code should take.

## Why

Modules drift. A directory that started uniform — every file an `imports → types → functions` triplet — gradually grows files with leaked helpers, inline configs, and "just one more thing" abstractions. AI coding agents accelerate this by adding helpful-looking changes that conform to no shared shape.

Most existing structural linting tools take a "find this pattern" model. This plugin inverts that: the template describes the **whole file**, and anything not accounted for is a violation. The closed vocabulary of refinements is intentional — it keeps templates legible to agents reading them cold, which is the design's primary user.

## Install

```sh
npm install --save-dev eslint eslint-plugin-templates
```

For TypeScript files you'll also want `@typescript-eslint/parser`:

```sh
npm install --save-dev @typescript-eslint/parser
```

## Quick start

```js
// eslint.config.js
import templates from "eslint-plugin-templates";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/features/**/*.ts"],
    languageOptions: { parser: tsParser },
    plugins: { templates },
    rules: {
      "templates/file": [
        "error",
        {
          template: {
            id: "feature",
            body: "${IMPORTS}\n${FUNCTIONS}",
            variables: {
              IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
              FUNCTIONS: { type: "FunctionDeclaration", minOccurs: 1 },
            },
          },
        },
      ],
    },
  },
];
```

The above enforces: every file under `src/features/**/*.ts` consists of zero or more import declarations followed by one or more function declarations — nothing else. A `const x = 1;` at the top level fails the lint.

> **Note on `${...}`:** template bodies use `${VAR}` syntax for placeholders. Always pass the body as a **regular string**, not a JS template literal — `"${IMPORTS}"` is correct; `` `${IMPORTS}` `` would try to interpolate at JS-parse time.

## Examples

### Server handler file

```js
{
  template: {
    id: "handler",
    body: "${IMPORTS}\n${HANDLER}",
    variables: {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 1 },
      HANDLER: {
        type: "FunctionDeclaration",
        async: true,
        exported: true,
        named: /^handle[A-Z]/,
      },
    },
  },
}
```

Each handler file must have at least one import and an `export async function handleX()` matching the camelCase pattern.

### React component file

```js
{
  template: {
    id: "component",
    body: "${IMPORTS}\n${COMPONENT}",
    variables: {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 1 },
      COMPONENT: {
        type: "FunctionDeclaration",
        default: true,
        named: /^[A-Z]/,
      },
    },
  },
}
```

Forces a default-exported, PascalCase function component as the file's payload.

### Types-only file

```js
{
  template: {
    id: "types",
    body: "${TYPES}",
    variables: {
      TYPES: {
        type: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"],
        minOccurs: 1,
        maxOccurs: 50,
      },
    },
  },
}
```

Files in the types directory must contain only interfaces and type aliases — no functions, no consts, no imports.

### Reducer file with cross-position binding

```js
{
  template: {
    id: "reducer",
    body: "${IMPORTS}\nfunction ${NAME}(state, action) {}\nexport { ${NAME} };",
    variables: {
      IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
    },
  },
}
```

The same `${NAME}` placeholder appears twice — the matcher unifies them. The function name and the exported identifier must agree.

### Type-only imports for declaration files

```js
{
  template: {
    id: "declarations",
    body: "${TYPE_IMPORTS}\n${TYPES}",
    variables: {
      TYPE_IMPORTS: { type: "ImportDeclaration", typeOnly: true, minOccurs: 0 },
      TYPES: { type: "TSInterfaceDeclaration", minOccurs: 1 },
    },
  },
}
```

`typeOnly: true` requires `import type { ... }` syntax. A regular `import { ... }` fails.

### Configuration export with constrained keys

```js
{
  template: {
    id: "config",
    body: "export default ${CONFIG};",
    variables: {
      CONFIG: { type: "ObjectExpression" },
    },
  },
}
```

Forces the file to be a single default export of an object literal.

## Diagnostics

The rule emits one of six message IDs:

| ID | When |
|---|---|
| `divergence` | A literal template node and the file's node have different shapes. |
| `missingRequired` | A variable's `minOccurs` couldn't be satisfied — no kind-matching nodes were found. |
| `refinementFailed` | A node matched the variable's kind but failed a refinement (e.g. `fromPath`, `named`, `arity`). |
| `bindingMismatch` | A `${NAME}` placeholder used in two positions resolved to different identifiers. |
| `extraContent` | The file has trailing content the template doesn't account for. |
| `unknownVariable` | The template body references `${X}` but `variables.X` isn't declared. |

See [docs/rules/file.md](./docs/rules/file.md) for the full configuration reference, all 12 refinements, and the supported node-kind table.

## Comparison with `eslint-plugin-project-structure`

`eslint-plugin-project-structure` solves a similar problem with selector-and-config-based rules — you describe the file's shape via a configuration object listing allowed elements. This plugin solves it with **template-and-example-based** rules — you write what a conforming file looks like, with `${VARS}` for the parts that legitimately vary.

Different authoring models for different team preferences. If you'd rather configure a list of allowed top-level statements, `project-structure` is great. If you'd rather show an example and have the matcher enforce it, this is yours.

## License

[MIT](./LICENSE)
