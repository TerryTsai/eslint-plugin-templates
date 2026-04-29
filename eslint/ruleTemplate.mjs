export const ruleTemplate = {
  id: "rule",
  body: `
    {{IMPORTS}}
    {{SETUP}}
    {{RULE}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 6 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration", "FunctionDeclaration"], named: /^(?!rule$)/, minOccurs: 0, maxOccurs: 4 },
    RULE: { type: "VariableDeclaration", named: "rule" },
  },
};
