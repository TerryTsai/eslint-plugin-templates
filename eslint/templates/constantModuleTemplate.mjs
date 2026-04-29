export const constantModuleTemplate = {
  id: "constant-module",
  body: `
    {{IMPORTS}}
    {{EXPORTED}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 10 },
    EXPORTED: { type: "VariableDeclaration", minOccurs: 1, maxOccurs: 1 },
  },
};
