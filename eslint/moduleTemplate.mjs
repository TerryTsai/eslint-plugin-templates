export const moduleTemplate = {
  id: "module",
  body: `
    {{IMPORTS}}
    {{SETUP}}
    {{EXPORTED}}
    {{INTERNALS}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 13 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration"], minOccurs: 0, maxOccurs: 5 },
    EXPORTED: { type: "FunctionDeclaration", exported: true, minOccurs: 1, maxOccurs: 1 },
    INTERNALS: { type: ["FunctionDeclaration", "VariableDeclaration"], minOccurs: 0, maxOccurs: 7 },
  },
};
