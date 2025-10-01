import { z } from "zod";
import { ESTIMATE_OPTIONS } from "@/constants/linear";

/**
 * Validation schema for bulk issue creation
 */
export const bulkIssueRowSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(255, "タイトルは255文字以内で入力してください"),
  description: z
    .string()
    .max(5000, "説明は5000文字以内で入力してください")
    .optional(),
  cycleId: z.string().uuid("無効なCycle IDです").optional().or(z.literal("")),
  estimate: z
    .number()
    .refine(
      (val) =>
        ESTIMATE_OPTIONS.includes(val as (typeof ESTIMATE_OPTIONS)[number]),
      {
        message: `見積もりは ${ESTIMATE_OPTIONS.join(", ")} のいずれかを選択してください`,
      },
    )
    .optional(),
  dueDate: z.string().optional(),
  assigneeId: z
    .string()
    .uuid("無効なAssignee IDです")
    .optional()
    .or(z.literal("")),
  parentId: z.string().uuid("無効なParent IDです").optional().or(z.literal("")),
});

export const bulkIssueInputSchema = z
  .array(bulkIssueRowSchema)
  .min(1, "少なくとも1つのIssueを入力してください");

export type BulkIssueRowInput = z.infer<typeof bulkIssueRowSchema>;
