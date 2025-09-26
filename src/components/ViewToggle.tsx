"use client";

import type { LinearCycle, LinearIssue } from "@/lib/actions";
import { Icon } from "./Icon";

interface Assignee {
  id: string;
  name: string;
  displayName: string;
}

interface FilterProps {
  cycles: LinearCycle[];
  issues: LinearIssue[];
  selectedCycle: string | null;
  selectedAssignee: string | null;
  onCycleChange: (cycleId: string | null) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  isLoading?: boolean;
}

export function FilterControls({
  cycles,
  issues,
  selectedCycle,
  selectedAssignee,
  onCycleChange,
  onAssigneeChange,
  isLoading = false
}: FilterProps) {
  // Extract unique assignees from issues
  const assignees: Assignee[] = Array.from(
    new Map(
      issues
        .filter(issue => issue.assignee)
        .map(issue => [
          issue.assignee!.id,
          issue.assignee!
        ])
    ).values()
  ).sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Find selected cycle details for period display
  const selectedCycleData = selectedCycle
    ? cycles.find(cycle => cycle.id === selectedCycle)
    : null;

  // Format cycle period
  const formatCyclePeriod = (cycle: LinearCycle) => {
    const startDate = new Date(cycle.startsAt);
    const endDate = new Date(cycle.endsAt);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)} (${diffDays}日間)`;
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Cycle Filter */}
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-300 flex items-center space-x-1">
          <Icon name="bar_chart" className="text-gray-300" />
          <span>Cycle:</span>
        </span>
        <select
          value={selectedCycle || ""}
          onChange={(e) => onCycleChange(e.target.value || null)}
          disabled={isLoading}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">すべてのCycle</option>
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name}
            </option>
          ))}
        </select>
        {selectedCycleData && (
          <span className="text-sm text-gray-400 flex items-center space-x-1">
            <Icon name="calendar_month" className="text-gray-400" size="sm" />
            <span>{formatCyclePeriod(selectedCycleData)}</span>
          </span>
        )}
      </div>

      {/* Assignee Filter */}
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-300 flex items-center space-x-1">
          <Icon name="person" className="text-gray-300" />
          <span>Assignee:</span>
        </span>
        <select
          value={selectedAssignee || ""}
          onChange={(e) => onAssigneeChange(e.target.value || null)}
          disabled={isLoading}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">すべてのAssignee</option>
          <option value="unassigned">未アサイン</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
