// Curated list of popular exercises, grouped by muscle group, that users can
// quickly pick from the "Add an exercise" dropdown instead of typing by hand.
export type FavoriteGroup = {
  group: string;
  exercises: string[];
};

export const FAVORITE_EXERCISES: FavoriteGroup[] = [
  {
    group: "Chest",
    exercises: [
      "Bench Press",
      "Incline Bench Press",
      "Dumbbell Press",
      "Chest Fly",
      "Push-up",
      "Dip",
    ],
  },
  {
    group: "Back",
    exercises: [
      "Deadlift",
      "Barbell Row",
      "Pull-up",
      "Lat Pulldown",
      "Seated Cable Row",
      "Face Pull",
    ],
  },
  {
    group: "Legs",
    exercises: [
      "Squat",
      "Front Squat",
      "Leg Press",
      "Romanian Deadlift",
      "Lunge",
      "Leg Curl",
      "Leg Extension",
      "Calf Raise",
    ],
  },
  {
    group: "Shoulders",
    exercises: [
      "Overhead Press",
      "Dumbbell Shoulder Press",
      "Lateral Raise",
      "Rear Delt Fly",
      "Arnold Press",
    ],
  },
  {
    group: "Arms",
    exercises: [
      "Barbell Curl",
      "Dumbbell Curl",
      "Hammer Curl",
      "Triceps Pushdown",
      "Skull Crusher",
      "Close-Grip Bench Press",
    ],
  },
  {
    group: "Core",
    exercises: [
      "Plank",
      "Hanging Leg Raise",
      "Cable Crunch",
      "Russian Twist",
    ],
  },
];

// name (lowercased) -> muscle group, so the server can tag exercises added
// from the favorites dropdown.
const GROUP_BY_NAME = new Map<string, string>(
  FAVORITE_EXERCISES.flatMap((g) =>
    g.exercises.map((name) => [name.toLowerCase(), g.group] as const),
  ),
);

export function muscleGroupFor(name: string): string | null {
  return GROUP_BY_NAME.get(name.trim().toLowerCase()) ?? null;
}

// A sensible starter set for brand-new accounts (the empty-state one-click add).
export const STARTER_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Pull-up",
];
