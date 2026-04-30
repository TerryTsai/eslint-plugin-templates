/** Mutable map of cross-position bindings, threaded through every match call. */
export type Bindings = Map<string, unknown>;

/** Result of a match attempt; on failure, `path` walks down to the offending position. */
export type MatchResult =
  | { ok: true }
  | { ok: false; reason: string; path?: (string | number)[] };

/** Matcher for a value of type `T` at a key or value position. */
export type ValueMatcher<T = unknown> =
  | T
  | NodeMatcher<T>
  | NodeMatcher<T>[]
  | (T extends readonly (infer E)[] ? NodeMatcher<E>[] : never)
  | { "@regex": string; flags?: string }
  | { "@bind": string };

/** Declarative matcher over a node's keys; supply `T` to narrow. */
export type ObjectMatcher<T = Record<string, unknown>> = {
  [K in keyof T]?: ValueMatcher<T[K]>;
};

/** Tree-node matcher: metadata plus an `ObjectMatcher`. */
export type NodeMatcher<T = unknown> = {
  name?: string;
  min?: number;
  max?: number;
  match: ObjectMatcher<T>;
};
