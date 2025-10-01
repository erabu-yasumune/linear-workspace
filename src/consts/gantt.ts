/**
 * Gantt chart constants
 */

// Progress state types
export type ProgressState = "completed" | "started";

// State priority types
export type StateTypePriority =
  | "unstarted"
  | "backlog"
  | "started"
  | "completed"
  | "canceled"
  | "cancelled";

// Progress values by state type
export const PROGRESS_BY_STATE: Record<string, number> = {
  completed: 100,
  started: 50,
  default: 0,
};

// State priority for sorting
export const STATE_TYPE_PRIORITY: Record<string, number> = {
  unstarted: 0,
  backlog: 1,
  started: 2,
  completed: 3,
  canceled: 4,
  cancelled: 4, // Alternative spelling
};

// Layout constants
export const HIERARCHY_INDENT_PX: number = 16;
export const MIN_COLUMN_WIDTH_PX: number = 40;

// Sorting constants
export const UNASSIGNED_SORT_KEY: string = "zz_unassigned";
export const HIERARCHY_SEPARATOR: string = " > ";

// Hierarchy display symbols
export const HIERARCHY_SYMBOLS: Record<string, string> = {
  CHILD_PREFIX: "|_",
};
