export const entryTemplate = {
  id: "entry",
  body: `
    {{IMPORTS}}
    {{EXPORT_ASSIGNMENT}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 1 },
    EXPORT_ASSIGNMENT: { type: "TSExportAssignment", minOccurs: 1, maxOccurs: 1 },
  },
};
