# Changelog

## 0.2.0

New `eslint-plugin-templates/config` subpath for describing whole-folder layouts as reusable modules.

- `defineModule({ contents, closed? })` — declarative tree of file and folder entries. Folder keys end with `/` and take a nested tree (or another `defineModule` for folder-local options); file keys take a `MatchTemplate`. Multi-segment keys and `**` are rejected statically (template literal types) and at runtime.
- `applyModule({ module, root, parser, parserOptions? })` — expands a module into ESLint flat-config blocks rooted at the given path. Sibling globs auto-sort by specificity (most-specific wins via ESLint's last-match semantics). `closed: true | { message, extensions }` emits a `templates/forbid` block per folder.
- Modules are pure data — define once, apply at multiple roots.
- Reference: [docs/modules.md](./docs/modules.md). README "Modules" section walks through a microservice resource example.

## 0.1.2

Internal cleanup. No public API or behavior changes.

- Folder restructure: `parsing/` pulled out of `matcher/` to reflect that template body parsing is preprocessing, separate from matching.
- Plugin self-dogfooding extended; `brace-style` rule enforces multi-line function bodies.
- Tooling refresh: vitest 3.2.4, GitHub Actions `checkout`/`setup-node` v6, Node 24 in CI.

## 0.1.1

Internal cleanup. No public API or behavior changes.

- Matcher reorganized into `parsing/`, `kinds/`, `refinements/checks/`, `sequence/` subfolders, one export per file.
- Plugin now self-dogfoods: ESLint config applies the plugin's own `templates/match` rule to its source files.

## 0.1.0

Initial release.

- `templates/match` — match files against declarative templates. Five slot variants (Import, Function, Property, Literal, Any) with twelve refinements covering AST kind, identifier name, import source, async/exported/default flags, parameter count, return-type kind, property value kind, optional/readonly flags, and literal pattern.
- `templates/forbid` — reject every file matched by the rule's `files` glob, with an optional custom message. Pairs with ESLint's `ignores` to allow-list specific files.
- Cross-position inline binding: the same `${NAME}` placeholder in multiple positions in the body unifies on the file's identifier.
- Six diagnostic messageIds (`divergence`, `missingRequired`, `refinementFailed`, `bindingMismatch`, `extraContent`, `unknownSlot`) for `templates/match`; one (`forbidden`) for `templates/forbid`.
- Strict JSON Schema for both rules' options — cross-variant refinements are rejected at config-load time.
- TypeScript-first: parses templates and target files via `@typescript-eslint/typescript-estree`. Peer-depends on `eslint >= 8`.
