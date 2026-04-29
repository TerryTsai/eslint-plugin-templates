export const builderModuleTemplate = {
  id: "builder-module",
  body: `
    {{IMPORTS}}
    {{EXPORTED}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 10 },
    EXPORTED: { type: "FunctionDeclaration", exported: true, minOccurs: 1, maxOccurs: 1 },
  },
};
