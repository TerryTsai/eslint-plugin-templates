import { type Slot } from "../../types";

interface Cardinality {
  min: number;
  max: number;
}

export function cardinalityOf(slot: Slot): Cardinality {
  const min = slot.minOccurs ?? 1;
  const max = slot.maxOccurs ?? (slot.minOccurs === undefined ? 1 : Infinity);
  return { min, max };
}
