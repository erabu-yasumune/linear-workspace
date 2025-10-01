/**
 * Linear API constants
 */

/**
 * Available estimate values for Linear issues
 * Based on Fibonacci sequence commonly used in agile estimation
 */
export const ESTIMATE_OPTIONS = [0, 1, 2, 3, 4, 8, 13, 21] as const;

export type EstimateValue = (typeof ESTIMATE_OPTIONS)[number];
