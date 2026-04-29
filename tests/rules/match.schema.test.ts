import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { matchRuleSchema } from "../../src/rules/match.schema";

const ajv = new Ajv({ allErrors: false });
const validate = ajv.compile(matchRuleSchema[0]!);

const valid = (template: unknown): boolean => validate(template) as boolean;
const validWith = (slotX: unknown): boolean =>
  valid({ id: "x", body: "${X}", slots: { X: slotX } });

describe("schema", () => {
  it("accepts a minimal template", () => {
    expect(valid({ id: "x", body: "" })).toBe(true);
  });

  it("requires id and body", () => {
    expect(valid({ id: "x" })).toBe(false);
    expect(valid({ body: "" })).toBe(false);
  });

  it("rejects unknown top-level fields on the template", () => {
    expect(valid({ id: "x", body: "", weird: 1 })).toBe(false);
  });

  describe("variants", () => {
    it("accepts ImportSlot with typeOnly + fromPath", () => {
      expect(validWith({ type: "ImportDeclaration", typeOnly: true, fromPath: "react" })).toBe(true);
    });

    it("rejects ImportSlot with FunctionSlot refinement", () => {
      expect(validWith({ type: "ImportDeclaration", arity: 2 })).toBe(false);
    });

    it("accepts FunctionSlot across all five function-like kinds", () => {
      const kinds = ["FunctionDeclaration", "ArrowFunction", "FunctionExpression", "MethodDeclaration", "MethodSignature"];
      for (const k of kinds) {
        expect(validWith({ type: k, async: true, arity: 0 })).toBe(true);
      }
    });

    it("rejects FunctionSlot with valueKind (PropertySlot refinement)", () => {
      expect(validWith({ type: "FunctionDeclaration", valueKind: "Literal" })).toBe(false);
    });

    it("accepts LiteralSlot with matches", () => {
      expect(validWith({ type: "StringLiteral", matches: /foo/ })).toBe(true);
    });

    it("accepts AnySlot with non-specialized kind", () => {
      expect(validWith({ type: "VariableDeclaration", minOccurs: 0 })).toBe(true);
    });

    it("accepts AnySlot with array of kinds", () => {
      expect(validWith({ type: ["VariableDeclaration", "FunctionDeclaration"] })).toBe(true);
    });

    it("rejects unknown refinement on a specialized variant", () => {
      expect(validWith({ type: "ImportDeclaration", weird: 1 })).toBe(false);
    });
  });

  describe("base fields", () => {
    it("accepts minOccurs and maxOccurs as non-negative integers", () => {
      expect(validWith({ type: "ImportDeclaration", minOccurs: 0, maxOccurs: 5 })).toBe(true);
    });

    it("rejects negative minOccurs", () => {
      expect(validWith({ type: "ImportDeclaration", minOccurs: -1 })).toBe(false);
    });

    it("accepts named as string or RegExp object", () => {
      expect(validWith({ type: "FunctionDeclaration", named: "exact" })).toBe(true);
      expect(validWith({ type: "FunctionDeclaration", named: /pattern/ })).toBe(true);
    });
  });
});
