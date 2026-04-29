# `templates/forbid`

Reject every file matched by the rule's `files` glob. Pair with ESLint's `ignores` to allow-list specific files and reject anything else.

## Configuration

```ts
type ForbidOptions = {
  message?: string;
};
```

`message` is the diagnostic text. Default: `"This file is not allowed in the current scope."`.

## Usage

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

Any `.ts` file in `src/services/*/` not on the allow-list triggers `forbidden`.

## Diagnostics

| `messageId` | Message |
|---|---|
| `forbidden` | The configured `message`, or the default. |

## Limitations

- ESLint only lints files matched by some configured rule's `files` glob. Non-linted files (`.md`, `.json` without a configured parser, etc.) won't trigger this rule.
- `forbid` has no template — pair with `templates/match` to enforce the content of files you do allow.
