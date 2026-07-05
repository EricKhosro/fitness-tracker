// Personal-record detection. All weights are in kilograms (storage unit).

export type PrFlags = { weight: boolean; oneRm: boolean };

// Epley formula for estimated one-rep max.
export function epleyOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

// Walk one exercise's sets in chronological order and flag every set that
// established a new record (heaviest weight, or best estimated 1RM).
export function computePrFlags(
  sets: { id: string; weight: number; reps: number }[],
): Map<string, PrFlags> {
  const flags = new Map<string, PrFlags>();
  let maxWeight = 0;
  let maxOneRm = 0;
  for (const s of sets) {
    const oneRm = epleyOneRepMax(s.weight, s.reps);
    const weightPr = s.weight > maxWeight;
    const oneRmPr = oneRm > maxOneRm + 1e-9;
    if (weightPr) maxWeight = s.weight;
    if (oneRmPr) maxOneRm = oneRm;
    flags.set(s.id, { weight: weightPr, oneRm: oneRmPr });
  }
  return flags;
}
