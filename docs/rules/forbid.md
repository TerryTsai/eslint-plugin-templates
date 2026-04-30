# `templates/forbid`

Reject every file the rule's `files` glob covers. Always emits a single diagnostic per file. Pair with ESLint's `ignores` to allow-list specific files and reject everything else.

## Configuration

```ts
type ForbidOptions = { message?: string };
```

Default message: `"This file is not allowed in the current scope."`.

## Usage

```js
import { forbidConfig } from "eslint-plugin-templates";

forbidConfig({
  files: "src/services/*/*.ts",
  ignores: [
    "src/services/*/index.ts",
    "src/services/*/types.ts",
    "src/services/*/handler-*.ts",
  ],
  message: "Service folders only contain index.ts, types.ts, and handler-*.ts.",
});
```

## Diagnostic

Single message ID: `forbidden`. The diagnostic uses the configured `message` (or the default).

## Limitations

- Only sees files ESLint lints. To catch non-JS/TS files (`*.md`, `*.json`, etc.), extend ESLint's parser configuration to those file types.
