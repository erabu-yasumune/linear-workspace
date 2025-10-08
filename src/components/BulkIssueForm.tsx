"use client";

import { useState, useTransition } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { z } from "zod";
import { ESTIMATE_OPTIONS } from "@/constants/linear";
import {
  createBulkIssues,
  type LinearCycle,
  type LinearTeam,
  type LinearUser,
} from "@/lib/actions";
import { bulkIssueInputSchema } from "@/lib/validations/issue";
import { LoadingSpinner } from "./LoadingSpinner";

interface BulkIssueRow {
  id: string;
  title: string;
  description: string;
  cycleId: string;
  estimate: string;
  dueDate: Date | null;
  parentId: string;
  assigneeId: string;
}

interface BulkIssueFormProps {
  cycles: LinearCycle[];
  users: LinearUser[];
  teams: LinearTeam[];
  issues: Array<{ id: string; title: string; identifier: string }>;
  onSuccess?: () => void;
}

export function BulkIssueForm({
  cycles,
  users,
  teams,
  issues,
  onSuccess,
}: BulkIssueFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams.length > 0 ? teams[0].id : "",
  );
  const [rows, setRows] = useState<BulkIssueRow[]>([
    {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      cycleId: "",
      estimate: "",
      dueDate: null,
      parentId: "",
      assigneeId: "",
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        cycleId: "",
        estimate: "",
        dueDate: null,
        parentId: "",
        assigneeId: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (
    id: string,
    field: keyof BulkIssueRow,
    value: string | Date | null,
  ) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate team selection
    if (!selectedTeamId) {
      setError("Teamを選択してください");
      return;
    }

    // Filter rows with title
    const rowsWithTitle = rows.filter((row) => row.title.trim() !== "");
    if (rowsWithTitle.length === 0) {
      setError("少なくとも1つのIssueにタイトルを入力してください");
      return;
    }

    // Prepare data for validation
    const issueData = rowsWithTitle.map((row) => ({
      title: row.title.trim(),
      description: row.description.trim() || undefined,
      cycleId: row.cycleId || undefined,
      estimate: row.estimate ? Number(row.estimate) : undefined,
      dueDate: row.dueDate
        ? `${row.dueDate.getFullYear()}-${String(row.dueDate.getMonth() + 1).padStart(2, "0")}-${String(row.dueDate.getDate()).padStart(2, "0")}`
        : undefined,
      parentId: row.parentId || undefined,
      assigneeId: row.assigneeId || undefined,
    }));

    // Validate with Zod
    const validationResult = bulkIssueInputSchema.safeParse(issueData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setError(
        `入力エラー: ${firstError.path.join(".")} - ${firstError.message}`,
      );
      return;
    }

    startTransition(async () => {
      try {
        await createBulkIssues(issueData, selectedTeamId);

        // Reset form
        setRows([
          {
            id: crypto.randomUUID(),
            title: "",
            description: "",
            cycleId: "",
            estimate: "",
            dueDate: null,
            parentId: "",
            assigneeId: "",
          },
        ]);

        onSuccess?.();
      } catch (err) {
        console.error("Bulk issue creation failed:", err);
        setError(
          err instanceof Error ? err.message : "Issue登録に失敗しました",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Team Selector */}
      <div className="bg-card rounded-lg border border-border p-4">
        <label htmlFor="team-select" className="block text-sm font-medium mb-2">
          Team *
        </label>
        <select
          id="team-select"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full max-w-md bg-card text-foreground text-sm px-3 py-2 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        >
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.key})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-card rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-primary/5 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left font-medium min-w-[180px]">
                Title *
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[350px]">
                Description
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[140px]">
                Cycle
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[100px]">
                Estimate
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[130px]">
                Due Date
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[140px]">
                Assignee
              </th>
              <th className="px-3 py-2 text-left font-medium min-w-[140px]">
                Parent Issue
              </th>
              <th className="px-3 py-2 text-center font-medium w-[50px]">
                削除
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-3 py-2 align-top">
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, "title", e.target.value)}
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Issue title"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.id, "description", e.target.value)
                    }
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[60px]"
                    placeholder="Optional description"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.cycleId}
                    onChange={(e) =>
                      updateRow(row.id, "cycleId", e.target.value)
                    }
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Cycle</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.estimate}
                    onChange={(e) =>
                      updateRow(row.id, "estimate", e.target.value)
                    }
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Estimate</option>
                    {ESTIMATE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <DatePicker
                    selected={row.dueDate}
                    onChange={(date) => updateRow(row.id, "dueDate", date)}
                    dateFormat="yyyy-MM-dd"
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholderText="Select date"
                    isClearable
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.assigneeId}
                    onChange={(e) =>
                      updateRow(row.id, "assigneeId", e.target.value)
                    }
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    value={row.parentId}
                    onChange={(e) =>
                      updateRow(row.id, "parentId", e.target.value)
                    }
                    className="w-full bg-card text-foreground text-xs px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Parent</option>
                    {issues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.identifier} - {issue.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          + 行を追加
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-primary text-primary-foreground hover:opacity-80 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" />
              <span>登録中...</span>
            </>
          ) : (
            <span>一括登録</span>
          )}
        </button>
      </div>
    </form>
  );
}
