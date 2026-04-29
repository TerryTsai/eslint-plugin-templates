export const constantTemplate = {
  id: "constant",
  body: `
    {{IMPORTS}}
    {{EXPORTED}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 2 },
    EXPORTED: { type: "VariableDeclaration", minOccurs: 1, maxOccurs: 1 },
  },
};
