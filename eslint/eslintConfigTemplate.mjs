export const eslintConfigTemplate = {
  id: "eslint-config",
  body: `
    {{IMPORTS}}
    {{EXPORT}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 20 },
    EXPORT: { type: "ExportDefaultDeclaration", minOccurs: 1, maxOccurs: 1 },
  },
};
