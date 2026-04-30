import { type NodeMatcher } from "./match/types";

/**
 * Folder shape: optional closed-scope rejection plus a content map. The generic
 * is used at the entry point to validate user literals at compile time; `Layout`
 * (no arg) is the structural fallback used by walker code.
 */
export type Layout<L = unknown> = {
  readonly closed?: { readonly message?: string; readonly extensions?: readonly string[] };
  readonly content: L extends { content: infer C extends Record<string, unknown> }
    ? {
        [K in keyof C & string]:
          K extends "" ? never
          : K extends `${string}**${string}` ? never
          : K extends `${string}/${string}/${string}` ? never
          : K extends `${string}/` ? (C[K] extends Layout ? Layout<C[K]> : never)
          : K extends `${string}/${string}` ? never
          : (C[K] extends NodeMatcher ? C[K] : never);
      }
    : { readonly [key: string]: NodeMatcher | Layout };
};
