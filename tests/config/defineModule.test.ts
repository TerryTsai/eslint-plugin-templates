import { describe, expect, it } from "vitest";

import { defineModule } from "../../src/config/defineModule";
import { type MatchTemplate } from "../../src/types";

const tpl: MatchTemplate = { id: "noop", body: "" };

describe("defineModule — validation", () => {
  it("accepts a flat tree of file entries", () => {
    expect(() => defineModule({ contents: { "index.ts": tpl, "*.ts": tpl } })).not.toThrow();
  });

  it("accepts a nested tree of folders and files", () => {
    expect(() =>
      defineModule({
        contents: {
          "index.ts": tpl,
          "kinds/": { "*.ts": tpl },
          "refinements/": { "applyRefinements.ts": tpl, "checks/": { "*.ts": tpl } },
        },
      }),
    ).not.toThrow();
  });

  it("rejects multi-segment file keys (statically and at runtime)", () => {
    // @ts-expect-error: file keys must not contain slashes
    expect(() => defineModule({ contents: { "a/b/c.ts": tpl } })).toThrow(/file keys must not contain/);
  });

  it("rejects a folder key with internal slash", () => {
    // @ts-expect-error: folder keys take exactly one trailing /
    expect(() => defineModule({ contents: { "a/b/": { "x.ts": tpl } } })).toThrow(/exactly one trailing/);
  });

  it("rejects `**` in any key", () => {
    // @ts-expect-error: `**` is not allowed in keys
    expect(() => defineModule({ contents: { "**/*.ts": tpl } })).toThrow(/is not allowed in keys/);
  });

  it("rejects empty keys", () => {
    // @ts-expect-error: empty keys are not allowed
    expect(() => defineModule({ contents: { "": tpl } })).toThrow(/empty keys/);
  });

  it("validates nested keys too", () => {
    expect(() =>
      // @ts-expect-error: nested file key contains a slash
      defineModule({ contents: { "kinds/": { "a/b.ts": tpl } } }),
    ).toThrow(/file keys must not contain/);
  });
});

describe("defineModule — closed normalization", () => {
  it("returns null when closed is omitted or false", () => {
    expect(defineModule({ contents: {} }).closed).toBeNull();
    expect(defineModule({ contents: {}, closed: false }).closed).toBeNull();
  });

  it("uses defaults when closed is true", () => {
    const m = defineModule({ contents: {}, closed: true });
    expect(m.closed?.message).toBe("This file is not allowed in the current scope.");
    expect(m.closed?.extensions).toEqual(["ts"]);
  });

  it("respects custom message and extensions", () => {
    const m = defineModule({
      contents: {},
      closed: { message: "go away", extensions: ["ts", "tsx"] },
    });
    expect(m.closed?.message).toBe("go away");
    expect(m.closed?.extensions).toEqual(["ts", "tsx"]);
  });
});

describe("defineModule — immutability", () => {
  it("freezes the result so accidental mutation throws", () => {
    const m = defineModule({ contents: { "index.ts": tpl } });
    expect(() => {
      (m as { closed: unknown }).closed = "oops";
    }).toThrow();
  });

  it("freezes the contents tree recursively", () => {
    const m = defineModule({ contents: { "kinds/": { "x.ts": tpl } } });
    const sub = m.contents["kinds/"] as Record<string, unknown>;
    expect(() => {
      sub["new.ts"] = tpl;
    }).toThrow();
  });
});
