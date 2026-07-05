// The body measurements a user can track. Bodyweight follows the user's weight
// unit; every other measurement is a circumference in centimetres.
export const BODY_KIND_VALUES = [
  "bodyweight",
  "waist",
  "chest",
  "arm",
  "thigh",
  "hips",
] as const;

export type BodyKind = (typeof BODY_KIND_VALUES)[number];

const LABELS: Record<BodyKind, string> = {
  bodyweight: "Bodyweight",
  waist: "Waist",
  chest: "Chest",
  arm: "Arm",
  thigh: "Thigh",
  hips: "Hips",
};

export const BODY_KINDS = BODY_KIND_VALUES.map((value) => ({
  value,
  label: LABELS[value],
}));
