import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import * as path from "node:path";

import * as parser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import { beforeAll, expect, it } from "vitest";

import { compile } from "../../src/compile";

const ROOT = path.resolve(__dirname, "../..");
const DIST = path.join(ROOT, "dist/index.js");
const FIXTURES = path.join(__dirname, "fixtures");

const requireCJS = createRequire(__filename);

interface BuiltPlugin {
  meta: { name: string; version: string };
  rules: Record<string, unknown>;
}

let plugin: BuiltPlugin;

beforeAll(() => {
  execSync("npm run build", { cwd: ROOT, stdio: "ignore" });
  plugin = (requireCJS(DIST) as { default?: BuiltPlugin }).default ?? requireCJS(DIST) as BuiltPlugin;
}, 60_000);

const parse = (src: string): unknown =>
  parser.parseForESLint(src, { ecmaVersion: 2022, sourceType: "module" }).ast;

const HANDLER_TEMPLATE = {
  name: "handler",
  match: compile(`
    {{IMPORTS}}
    {{HANDLER}}
  `, {
    IMPORTS: { min: 0, max: 5, match: { type: "ImportDeclaration" } },
    HANDLER: { match: { type: "ExportNamedDeclaration", declaration: { match: { type: "FunctionDeclaration" } } } },
  }, parse),
};

const LANGUAGE_OPTIONS = { parser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } };

function withRule(rule: string, options: unknown, files: string[]): ESLint {
  return new ESLint({
    cwd: FIXTURES,
    overrideConfigFile: true,
    overrideConfig: [{
      files,
      languageOptions: LANGUAGE_OPTIONS,
      plugins: { templates: plugin as unknown as ESLint.Plugin },
      rules: { [rule]: ["error", options] },
    }],
  });
}

it("e2e: plugin metadata has the expected shape", () => {
  const pkg = requireCJS(path.join(ROOT, "package.json")) as { version: string };
  expect(plugin.meta.name).toBe("eslint-plugin-templates");
  expect(plugin.meta.version).toBe(pkg.version);
  expect(plugin.rules).toHaveProperty("match");
  expect(plugin.rules).toHaveProperty("forbid");
});

it("e2e: templates/match accepts a conforming file", async () => {
  const eslint = withRule("templates/match", HANDLER_TEMPLATE, ["**/*.ts"]);
  const [result] = await eslint.lintFiles([path.join(FIXTURES, "conforming.ts")]);
  expect(result?.messages).toEqual([]);
});

it("e2e: templates/match rejects a non-conforming file with divergence", async () => {
  const eslint = withRule("templates/match", HANDLER_TEMPLATE, ["**/*.ts"]);
  const [result] = await eslint.lintFiles([path.join(FIXTURES, "non-conforming.ts")]);
  expect(result?.messages.length).toBeGreaterThan(0);
  expect(result?.messages[0]?.ruleId).toBe("templates/match");
  expect(result?.messages[0]?.messageId).toBe("divergence");
});

it("e2e: templates/forbid emits a diagnostic on every file it sees", async () => {
  const eslint = withRule("templates/forbid", { message: "Not allowed here." }, ["**/forbidden.ts"]);
  const [result] = await eslint.lintFiles([path.join(FIXTURES, "forbidden.ts")]);
  expect(result?.messages.length).toBeGreaterThan(0);
  expect(result?.messages[0]?.ruleId).toBe("templates/forbid");
  expect(result?.messages[0]?.messageId).toBe("forbidden");
});
