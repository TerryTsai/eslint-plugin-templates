import { applyModule } from "../../src/config/applyModule";
import { type defineModule } from "../../src/config/defineModule";
import { type MatchTemplate } from "../../src/types";

export const A: MatchTemplate = { id: "a", body: "" };
export const B: MatchTemplate = { id: "b", body: "" };
export const C: MatchTemplate = { id: "c", body: "" };

export const fakeParser = { parse: () => ({}) };

export function blocksFor(module: ReturnType<typeof defineModule>, root = "src/x") {
  return applyModule({ module, root, parser: fakeParser });
}
