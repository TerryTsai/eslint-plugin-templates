export const typesModuleTemplate = {
  id: "types-module",
  body: "${IMPORTS}\n${TYPES}",
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 5 },
    TYPES: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration"], minOccurs: 1, maxOccurs: 20 },
  },
};
