export const leafCheckTemplate = {
  id: "refinement-check",
  body: "${IMPORTS}\n${CHECK}",
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 5 },
    CHECK: { type: "FunctionDeclaration", exported: true, minOccurs: 1, maxOccurs: 1 },
  },
};
