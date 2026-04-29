export interface BindingMismatch {
  name: string;
  bound: string;
  got: string;
}

export interface BindingContext {
  inline: Map<string, string>;
  mismatch: BindingMismatch | null;
}

export function bindingContext(): BindingContext {
  return { inline: new Map(), mismatch: null };
}
