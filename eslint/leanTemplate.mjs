export const leanTemplate = {
  id: "lean-module",
  body: `
    {{IMPORTS}}
    {{SETUP}}
    {{EXPORTED}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 5 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration"], minOccurs: 0, maxOccurs: 3 },
    EXPORTED: { type: "FunctionDeclaration", exported: true, minOccurs: 1, maxOccurs: 1 },
  },
};
