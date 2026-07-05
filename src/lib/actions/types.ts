// Shared result shape for form-driven server actions.
export type ActionState = {
  ok?: boolean;
  error?: string;
} | null;
