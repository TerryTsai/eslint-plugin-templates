interface BindingMismatch {
  name: string;
  bound: string;
  got: string;
}

/**
 * State carried through `structurallyEqual` so inline `${NAME}` placeholders unify across positions.
 * `inline` records each placeholder's first-seen identifier;
 * `mismatch` is set when a later occurrence disagrees.
 */
export interface BindingContext {
  inline: Map<string, string>;
  mismatch: BindingMismatch | null;
}

/** Construct a fresh binding context for one match attempt. */
export function bindingContext(): BindingContext {
  return { inline: new Map(), mismatch: null };
}
