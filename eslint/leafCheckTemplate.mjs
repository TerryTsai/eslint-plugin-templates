export const leafCheckTemplate = {
  id: "leaf-check",
  body: `
    {{IMPORTS}}
    {{CHECK}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 3 },
    CHECK: { type: "FunctionDeclaration", exported: true, minOccurs: 1, maxOccurs: 1 },
  },
};
