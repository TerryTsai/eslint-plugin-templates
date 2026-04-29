# `templates/forbid`

Reject every file matched by this rule's `files` glob. Used together with ESLint's `ignores` to allow-list specific files and reject anything else.

## How it works

The rule fires on every file ESLint hands it. There's no template, no AST inspection — its only job is to report a diagnostic. Scoping is entirely the responsibility of ESLint's `files` and `ignores` globs.

## Configuration

```ts
type ForbidOptions = {
  message?: string;
};
```

The `message` field is the entire diagnostic text, customizable per rule block. Default: `"This file is not allowed in the current scope."`.

## Usage

The pattern is `files` lists where the rule applies, `ignores` carves out the allow-list:

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

Any `.ts` file inside `src/services/*/` that isn't one of the allow-listed names triggers `forbidden`.

## Diagnostics

| `messageId` | Message |
|---|---|
| `forbidden` | The configured `message`, or the default if none provided. |

## Limitations

- ESLint only lints files matched by some configured rule's `files` glob. Non-linted files (e.g. `.md`, `.json` if no parser is configured for them) won't trigger this rule. To catch them, you need to extend ESLint's parser configuration to those file types.
- The rule has no template — pair with `templates/match` when you also want to enforce the content of the files you do allow.
