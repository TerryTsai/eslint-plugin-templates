import { describe, expect, it } from "vitest";

import { matchValue } from "../../src/match/matchValue";

describe("matchValue", () => {
  it("equality on primitives", () => {
    expect(matchValue("foo", "foo", new Map()).ok).toBe(true);
    expect(matchValue("foo", "bar", new Map()).ok).toBe(false);
    expect(matchValue(42, 42, new Map()).ok).toBe(true);
    expect(matchValue(true, false, new Map()).ok).toBe(false);
  });

  it("@regex tag tests against string targets", () => {
    expect(matchValue({ "@regex": "^foo" }, "foobar", new Map()).ok).toBe(true);
    expect(matchValue({ "@regex": "^foo" }, "barfoo", new Map()).ok).toBe(false);
    expect(matchValue({ "@regex": "^x" }, 7, new Map()).ok).toBe(false);
  });

  it("@bind tag captures and checks against the bindings map", () => {
    const bindings = new Map();
    expect(matchValue({ "@bind": "N" }, "first", bindings).ok).toBe(true);
    expect(bindings.get("N")).toBe("first");
    expect(matchValue({ "@bind": "N" }, "first", bindings).ok).toBe(true);
    expect(matchValue({ "@bind": "N" }, "second", bindings).ok).toBe(false);
  });

  it("null compares with null", () => {
    expect(matchValue(null, null, new Map()).ok).toBe(true);
    expect(matchValue(null, 0, new Map()).ok).toBe(false);
  });

  it("undefined matcher unconstrains", () => {
    expect(matchValue(undefined, "anything", new Map()).ok).toBe(true);
  });
});
