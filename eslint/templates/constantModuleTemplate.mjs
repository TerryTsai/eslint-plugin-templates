export const constantModuleTemplate = {
  id: "constant-module",
  body: "${IMPORTS}\n${EXPORTED}",
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 10 },
    EXPORTED: { type: "VariableDeclaration", minOccurs: 1, maxOccurs: 1 },
  },
};
