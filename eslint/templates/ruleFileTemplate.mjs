export const ruleFileTemplate = {
  id: "rule-file",
  body: `
    {{IMPORTS}}
    {{SETUP}}
    {{RULE}}
  `,
  slots: {
    IMPORTS: { type: "ImportDeclaration", minOccurs: 1, maxOccurs: 10 },
    SETUP: { type: ["TSTypeAliasDeclaration", "TSInterfaceDeclaration", "VariableDeclaration", "FunctionDeclaration"], named: /^(?!rule$)/, minOccurs: 0, maxOccurs: 10 },
    RULE: { type: "VariableDeclaration", named: "rule" },
  },
};
