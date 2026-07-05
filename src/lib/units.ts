// Weights are always stored in kilograms. The user can choose to *see* and
// *enter* them in kg or lb; these helpers convert between storage and display.
export type WeightUnit = "kg" | "lb";

const LB_PER_KG = 2.2046226218;

export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === "kg" || v === "lb";
}

// Stored kg -> number shown in the user's unit.
export function fromKg(kg: number, unit: WeightUnit): number {
  const v = unit === "lb" ? kg * LB_PER_KG : kg;
  return Math.round(v * 100) / 100;
}

// A value the user typed (in their unit) -> kg for storage.
export function toKg(value: number, unit: WeightUnit): number {
  const kg = unit === "lb" ? value / LB_PER_KG : value;
  return Math.round(kg * 1000) / 1000;
}

function trim(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

// "60 kg" / "132.28 lb"
export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${trim(fromKg(kg, unit))} ${unit}`;
}

// Volume (kg) -> "4,200 kg" style string in the user's unit, rounded to integer.
export function formatVolume(kg: number, unit: WeightUnit): string {
  const v = Math.round(fromKg(kg, unit));
  return `${v.toLocaleString()} ${unit}`;
}
