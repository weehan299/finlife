export type EntityType = "asset" | "liability" | "income" | "expense" | "assumptions";

export type DrawerState =
  | { open: false }
  | { open: true; mode: "add"; entityType: EntityType; defaultCategory?: string }
  | { open: true; mode: "edit"; entityType: EntityType; itemId: string };
