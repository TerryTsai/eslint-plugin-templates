# Changelog

## 0.1.0

Initial release.

- `templates/match` — match files against declarative templates. Five slot variants (Import, Function, Property, Literal, Any) with twelve refinements covering AST kind, identifier name, import source, async/exported/default flags, parameter count, return-type kind, property value kind, optional/readonly flags, and literal pattern.
- `templates/forbid` — reject every file matched by the rule's `files` glob, with an optional custom message. Pairs with ESLint's `ignores` to allow-list specific files.
- Cross-position inline binding: the same `${NAME}` placeholder in multiple positions in the body unifies on the file's identifier.
- Six diagnostic messageIds (`divergence`, `missingRequired`, `refinementFailed`, `bindingMismatch`, `extraContent`, `unknownSlot`) for `templates/match`; one (`forbidden`) for `templates/forbid`.
- Strict JSON Schema for both rules' options — cross-variant refinements are rejected at config-load time.
- TypeScript-first: parses templates and target files via `@typescript-eslint/typescript-estree`. Peer-depends on `eslint >= 8`.
