import { describe, expect, it } from "vitest";

import { bind } from "../src/matcher";

describe("bind", () => {
  it("returns a serializable @bind tag", () => {
    expect(bind("NAME")).toEqual({ "@bind": "NAME" });
  });

  it("output is JSON-serializable", () => {
    expect(JSON.stringify(bind("X"))).toBe('{"@bind":"X"}');
  });
});
