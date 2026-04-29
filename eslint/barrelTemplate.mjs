export const barrelTemplate = {
  id: "barrel",
  body: `
    {{REEXPORTS}}
  `,
  slots: {
    REEXPORTS: { type: "ExportNamedDeclaration", minOccurs: 1, maxOccurs: 5 },
  },
};
