export const schemaTemplate = {
  id: "schema",
  body: `
    {{IMPORTS}}
    {{SETUP}}
    {{SCHEMA}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 0, maxOccurs: 1 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration", "FunctionDeclaration"], named: /^(?!.*Schema$)/, minOccurs: 0, maxOccurs: 12 },
    SCHEMA: { type: "VariableDeclaration", named: /Schema$/ },
  },
};
