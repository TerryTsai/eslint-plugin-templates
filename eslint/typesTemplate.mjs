export const typesTemplate = {
  id: "types-only",
  body: `
    {{IMPORTS}}
    {{TYPES}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 2 },
    TYPES: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration"], minOccurs: 1, maxOccurs: 13 },
  },
};
