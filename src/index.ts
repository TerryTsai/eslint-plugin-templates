import { rule as fileRule } from "./rules/file";

const plugin = {
  meta: { name: "eslint-plugin-templates", version: "0.1.0-dev" },
  rules: { file: fileRule },
};

export = plugin;
