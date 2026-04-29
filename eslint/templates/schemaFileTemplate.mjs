export const schemaFileTemplate = {
  id: "schema-file",
  body: "${IMPORTS}\n${SETUP}\n${SCHEMA}",
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 5 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration", "FunctionDeclaration"], named: /^(?!.*Schema$)/, minOccurs: 0, maxOccurs: 30 },
    SCHEMA: { type: "VariableDeclaration", named: /Schema$/ },
  },
};
