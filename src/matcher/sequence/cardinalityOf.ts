import { type Slot } from "../../types";

interface Cardinality {
  min: number;
  max: number;
}

/**
 * Resolve a slot's cardinality.
 * With no `minOccurs`/`maxOccurs`, the slot is required exactly once.
 * Setting only `minOccurs: 0` opens an unbounded upper bound (zero-or-more);
 * other defaults follow naturally.
 */
export function cardinalityOf(slot: Slot): Cardinality {
  const min = slot.minOccurs ?? 1;
  const max = slot.maxOccurs ?? (slot.minOccurs === undefined ? 1 : Infinity);
  return { min, max };
}
