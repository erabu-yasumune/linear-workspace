/**
 * Color constants for UI components
 */

// Assignee color palette
export const ASSIGNEE_COLORS: string[] = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#6366f1", // indigo-500
  "#d946ef", // fuchsia-500
];

export const DEFAULT_ASSIGNEE_COLOR: string = "#6b7280"; // gray-500

// State types
export type StateType =
  | "completed"
  | "started"
  | "canceled"
  | "cancelled"
  | "unstarted"
  | "backlog";

// State-based text colors (Tailwind classes)
export const STATE_COLORS: Record<string, string> = {
  completed: "text-green-400",
  started: "text-blue-400",
  canceled: "text-red-400",
  cancelled: "text-red-400",
  unstarted: "text-gray-400",
  backlog: "text-yellow-400",
  default: "text-gray-400",
};
