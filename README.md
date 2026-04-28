# eslint-plugin-templates

ESLint plugin for template-based linting rules.

> **Status:** Work in progress. The `0.0.0` release reserves the package name; rules and configs will land in subsequent releases.

## Installation

```sh
npm install --save-dev eslint eslint-plugin-templates
```

## Usage

No rules are exported yet. Once rules ship, configure them in your ESLint config:

```js
// eslint.config.js
import templates from "eslint-plugin-templates";

export default [
  {
    plugins: { templates },
    rules: {
      // "templates/rule-name": "error",
    },
  },
];
```

## License

[MIT](./LICENSE)
