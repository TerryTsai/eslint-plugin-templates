import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import * as path from "node:path";

import * as parser from "@typescript-eslint/parser";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

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
  plugin = requireCJS(DIST) as BuiltPlugin;
}, 60_000);

describe("e2e: built plugin loads and runs through ESLint", () => {
  it("plugin metadata has the expected shape", () => {
    const pkg = requireCJS(path.join(ROOT, "package.json")) as { version: string };
    expect(plugin.meta.name).toBe("eslint-plugin-templates");
    expect(plugin.meta.version).toBe(pkg.version);
    expect(plugin.rules).toHaveProperty("match");
    expect(plugin.rules).toHaveProperty("forbid");
  });

  it("templates/match accepts a conforming file", async () => {
    const eslint = withMatch(plugin);
    const [result] = await eslint.lintFiles([path.join(FIXTURES, "conforming.ts")]);
    expect(result?.messages).toEqual([]);
  });

  it("templates/match rejects a non-conforming file with missingRequired", async () => {
    const eslint = withMatch(plugin);
    const [result] = await eslint.lintFiles([path.join(FIXTURES, "non-conforming.ts")]);
    expect(result?.messages.length).toBeGreaterThan(0);
    expect(result?.messages[0]?.ruleId).toBe("templates/match");
    expect(result?.messages[0]?.messageId).toBe("missingRequired");
  });

  it("templates/forbid emits a diagnostic on every file it sees", async () => {
    const eslint = withForbid(plugin);
    const [result] = await eslint.lintFiles([path.join(FIXTURES, "forbidden.ts")]);
    expect(result?.messages.length).toBeGreaterThan(0);
    expect(result?.messages[0]?.ruleId).toBe("templates/forbid");
    expect(result?.messages[0]?.messageId).toBe("forbidden");
  });
});

function withMatch(templates: BuiltPlugin): ESLint {
  return new ESLint({
    cwd: FIXTURES,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts"],
        languageOptions: { parser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
        plugins: { templates: templates as unknown as ESLint.Plugin },
        rules: {
          "templates/match": [
            "error",
            {
              id: "handler",
              body: "${IMPORTS}\n${HANDLER}",
              slots: {
                IMPORTS: { type: "ImportDeclaration", minOccurs: 0 },
                HANDLER: { type: "FunctionDeclaration", exported: true, async: true },
              },
            },
          ],
        },
      },
    ],
  });
}

function withForbid(templates: BuiltPlugin): ESLint {
  return new ESLint({
    cwd: FIXTURES,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/forbidden.ts"],
        languageOptions: { parser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
        plugins: { templates: templates as unknown as ESLint.Plugin },
        rules: {
          "templates/forbid": ["error", { message: "Not allowed here." }],
        },
      },
    ],
  });
}
