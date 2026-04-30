# eslint-plugin-templates

[![npm](https://img.shields.io/npm/v/eslint-plugin-templates.svg)](https://www.npmjs.com/package/eslint-plugin-templates)
[![CI](https://img.shields.io/github/actions/workflow/status/TerryTsai/eslint-plugin-templates/ci.yml?branch=main)](https://github.com/TerryTsai/eslint-plugin-templates/actions)
[![License: MIT](https://img.shields.io/npm/l/eslint-plugin-templates.svg)](./LICENSE)

Templates for file structure, enforced by ESLint.

Codebases tend to grow file-level conventions — every API resource has the same skeleton, every reducer the same shape. Conventions only hold if everyone follows them. This plugin lets you encode the convention as a structural template and lets ESLint hold the rest of the codebase to it.

## Install

```sh
npm install --save-dev eslint eslint-plugin-templates
```

Bring your own parser. Examples below use `@typescript-eslint/parser`; works with any ESLint-compatible parser (`espree`, `@babel/eslint-parser`, `vue-eslint-parser`, …). Requires ESLint 8 or later.

## Example

Suppose every API resource folder follows the same shape:

```
src/api/
├── orders/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.routes.ts
└── users/
    ├── users.controller.ts
    ├── users.service.ts
    └── users.routes.ts
```

A controller looks like:

```ts
import { Controller, Get } from "@nestjs/common";
import { OrdersService } from "./orders.service";

interface CreateOrderDto { /* ... */ }

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  // ...
}
```

Encode that shape and apply it across every resource folder:

```js
// eslint.config.js
import templates, { compile, layoutConfig } from "eslint-plugin-templates";
import tsParser from "@typescript-eslint/parser";

const parse = (src) => tsParser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const controller = {
  name: "controller",
  match: compile(`
    {{IMPORTS}}
    {{DTOS}}
    {{CLASS}}
  `, {
    IMPORTS: { min: 1, max: 20, match: { type: "ImportDeclaration" } },
    DTOS:    { min: 0, max: 10, match: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration"] } },
    CLASS:   { match: {
      type: "ExportNamedDeclaration",
      declaration: { match: { type: "ClassDeclaration" } },
    } },
  }, parse),
};

const service = /* analogous */;
const routes  = /* analogous */;

export default [
  ...layoutConfig({
    root: "src/api/*",
    layout: {
      closed: { message: "API resources contain controller, service, and routes only." },
      content: {
        "*.controller.ts": controller,
        "*.service.ts":    service,
        "*.routes.ts":     routes,
      },
    },
    languageOptions: { parser: tsParser },
  }),
];
```

A controller with an extra top-level helper fails. A misnamed file (`orders.helpers.ts`) lands outside the layout's allow-list and trips the closed-scope rejection.

## How it works

### Templates

A template is a `NodeMatcher` — a structural assertion over an AST node. Pin specific keys to specific values:

```js
const asyncFn = {
  match: { type: "FunctionDeclaration", async: true },
};
```

For anything bigger, `compile` takes a code snippet, replaces `{{NAME}}` placeholders with matchers from a map, and returns a NodeMatcher tree ready to drop into `match:`.

Inside `match`, each value can be:

- a primitive — equality (`async: true`)
- a NodeMatcher — recurse into a sub-node
- an array of NodeMatchers — list pairing (when the target is an array) or alternation
- `{ "@regex": pattern }` — RegExp test against a string target
- `{ "@bind": name }` — capture-or-check across positions

`bind(name)` and `regex(pattern, flags?)` build the last two as a convenience.

### Cross-position binding

The same `{{NAME}}` placeholder used at multiple identifier positions binds — the first occurrence captures, the rest must agree:

```js
match: compile(`
  function {{NAME}}() {}
  export { {{NAME}} };
`, {}, parse),
```

`function listUsers() {} export { listUsers };` matches. `function listUsers() {} export { fetchUsers };` doesn't.

### Layouts

A layout describes a folder. File names map to templates; folder names (trailing `/`) map to nested layouts. `closed` rejects anything not in the allow-list and propagates to descendant folders without their own.

```js
const apiResource = {
  closed: { message: "API resources contain controller, service, and routes only." },
  content: {
    "*.controller.ts": controller,
    "*.service.ts":    service,
    "*.routes.ts":     routes,
    "validation/": {
      content: { "*.dto.ts": dto, "*.schema.ts": schema },
    },
  },
};
```

`layoutConfig({ root, layout, … })` expands a layout into ESLint config blocks rooted at `root`. A glob root (`"src/api/*"`) applies the layout to every matching folder.

### Single-file rules

When you want one config block instead of a tree:

- `matchConfig({ files, template, … })` — apply `templates/match` to a glob.
- `forbidConfig({ files, ignores?, message?, … })` — reject every file the glob covers (use `ignores` to allow-list).

## TSESTree helpers

`eslint-plugin-templates/tsparser` ships ~25 small helpers that build matchers against TSESTree node shapes — wrappers (`exportNamedDecl`, `importDecl`, …), declarations (`functionDecl`, `classDecl`, `interfaceDecl`, …), atoms (`identifier`, `literal`, `decorator`), class members (`methodDef`, `propertyDef`), expressions (`callExpr`, `memberExpr`, `awaitExpr`, …), and TS types (`typeRef`, `unionType`, …). Each is typed against the AST node it produces:

```ts
import { exportNamedDecl, classDecl, decorator, callExpr, identifier } from "eslint-plugin-templates/tsparser";

const controller = {
  name: "controller",
  match: compile(`
    {{IMPORTS}}
    {{CLASS}}
  `, {
    IMPORTS: { min: 1, max: 20, match: { type: "ImportDeclaration" } },
    CLASS:   exportNamedDecl(classDecl({
      id: identifier("OrdersController"),
      decorators: [decorator(callExpr({ callee: identifier("Controller") }))],
    })),
  }, parse),
};
```

For non-TSESTree parsers, build matchers against the AST shapes the parser produces — the engine doesn't care which parser the helpers were named after.

### Type-safe authoring

`matcher<N>` is a runtime no-op that narrows `match` against a chosen TSESTree node type:

```ts
import { matcher } from "eslint-plugin-templates/tsparser";
import { type TSESTree } from "@typescript-eslint/utils";

const m = matcher<TSESTree.FunctionDeclaration>({
  name: "handler",
  match: { type: "FunctionDeclaration", async: true },
});
```

A typo like `arity: 2` fails at compile time.

## Using other parsers

`compile`'s third argument is any function `(source: string) => ast`. Wire up whichever parser ESLint supports:

```js
// espree (ESLint's default)
import * as espree from "espree";
const parse = (src) => espree.parse(src, { ecmaVersion: 2022, sourceType: "module" });

// @babel/eslint-parser
import { parseForESLint } from "@babel/eslint-parser";
const parse = (src) => parseForESLint(src, {
  requireConfigFile: false,
  babelOptions: { presets: ["@babel/preset-env"] },
}).ast;

// vue-eslint-parser (for SFC <script> blocks)
import { parseForESLint } from "vue-eslint-parser";
const parse = (src) => parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;
```

The matcher language references AST keys directly, so a template authored against TSESTree won't necessarily port to Babel's AST node shapes — but the engine itself doesn't care which parser produced the tree.

## Limitations

- One template per `templates/match` invocation.
- Layouts can reject unwanted files (`closed`) but can't require missing ones.
- No autofix.
- No type-resolved checks; everything is syntactic.

## Reference

- [`templates/match`](./docs/rules/match.md)
- [`templates/forbid`](./docs/rules/forbid.md)
- [Layouts](./docs/layouts.md)

## License

MIT
