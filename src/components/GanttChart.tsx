"use client";

import { useMemo } from "react";
import type { LinearIssue, LinearCycle } from "@/lib/actions";

interface GanttChartProps {
  issues: LinearIssue[];
  selectedCycle?: LinearCycle | null;
}

interface TimelineItem {
  id: string;
  title: string;
  identifier: string;
  assignee?: { id: string; displayName: string; name: string };
  startDate: Date | null;
  endDate: Date | null;
  state: {
    name: string;
    type: string;
  };
  progress: number;
}

function getProgressFromState(stateType: string): number {
  switch (stateType) {
    case "completed":
      return 100;
    case "started":
      return 50;
    default:
      return 0;
  }
}

// Assignee-based color generation
function getAssigneeColor(assigneeId: string | undefined): string {
  if (!assigneeId) return "#6b7280"; // gray-500

  const colors = [
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

  // Simple hash function to get consistent color for same assignee
  let hash = 0;
  for (let i = 0; i < assigneeId.length; i++) {
    hash = assigneeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getStatusColor(stateType: string): string {
  switch (stateType) {
    case "completed":
      return "text-green-400"; // Green for completed
    case "started":
      return "text-blue-400"; // Blue for in progress
    case "canceled":
    case "cancelled":
      return "text-red-400"; // Red for canceled
    case "unstarted":
      return "text-gray-400"; // Gray for not started
    case "backlog":
      return "text-yellow-400"; // Yellow for backlog
    default:
      return "text-gray-400"; // Default gray
  }
}

function formatDateShort(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}


export function GanttChart({ issues, selectedCycle }: GanttChartProps) {
  const timelineItems = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return issues.map((issue) => {
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      // Use issue dates or fallback to today
      if (issue.dueDate) {
        startDate = new Date(issue.createdAt);
        endDate = new Date(issue.dueDate);
      } else {
        // If no due date, show only today's date
        startDate = today;
        endDate = today;
      }

      return {
        id: issue.id,
        title: issue.title,
        identifier: issue.identifier,
        assignee: issue.assignee,
        startDate,
        endDate,
        state: issue.state,
        progress: getProgressFromState(issue.state.type),
      };
    });
  }, [issues]);

  // Sort items by assignee, then by start date, then by state type, then by identifier
  const sortedItems = useMemo(() => {
    // Define state type priority order
    const stateTypePriority: Record<string, number> = {
      unstarted: 0,
      backlog: 1,
      started: 2,
      completed: 3,
      canceled: 4,
      cancelled: 4, // Alternative spelling
    };

    return timelineItems.sort((a, b) => {
      // First sort by assignee (unassigned items go to the end)
      const aAssignee = a.assignee?.displayName || ""; // Empty string for unassigned
      const bAssignee = b.assignee?.displayName || "";

      // Unassigned items (empty displayName) should come last
      if (!aAssignee && bAssignee) return 1;
      if (aAssignee && !bAssignee) return -1;

      // Both have assignees or both are unassigned
      if (aAssignee || bAssignee) {
        const assigneeCompare = aAssignee.localeCompare(bAssignee);
        if (assigneeCompare !== 0) {
          return assigneeCompare;
        }
      }

      // Same assignee (or both unassigned), sort by start date
      const aStartDate = a.startDate?.getTime() || 0; // No start date = 0 (earliest)
      const bStartDate = b.startDate?.getTime() || 0;

      if (aStartDate !== bStartDate) {
        // Items without start date (0) come first, then sort by actual dates
        if (aStartDate === 0 && bStartDate !== 0) return -1;
        if (aStartDate !== 0 && bStartDate === 0) return 1;
        return aStartDate - bStartDate; // Earlier dates first
      }

      // Same assignee and start date, sort by state type priority
      const aPriority = stateTypePriority[a.state.type] ?? 999;
      const bPriority = stateTypePriority[b.state.type] ?? 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Same assignee, start date, and state, sort by identifier
      return a.identifier.localeCompare(b.identifier);
    });
  }, [timelineItems]);

  const timeRange = useMemo(() => {
    // If a cycle is selected, use the cycle's period
    if (selectedCycle) {
      const cycleStart = new Date(selectedCycle.startsAt);
      const cycleEnd = new Date(selectedCycle.endsAt);

      // Set to start/end of day for better alignment
      cycleStart.setHours(0, 0, 0, 0);
      cycleEnd.setHours(23, 59, 59, 999);

      return { start: cycleStart, end: cycleEnd };
    }

    // Default behavior when no cycle is selected
    const dates = timelineItems
      .flatMap((item) => [item.startDate, item.endDate])
      .filter(Boolean) as Date[];
    if (dates.length === 0) {
      const today = new Date();
      return { start: new Date(today), end: new Date(today) };
    }

    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add some padding
    start.setDate(start.getDate() - 3);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }, [timelineItems, selectedCycle]);

  // Generate date grid for header
  const dateGrid = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(timeRange.start);

    while (current <= timeRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [timeRange]);


  const getDaysDiff = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getItemPosition = (item: TimelineItem) => {
    if (!item.startDate) return { left: 0, width: 0 };

    const totalDays = getDaysDiff(timeRange.start, timeRange.end);
    const startOffset = getDaysDiff(timeRange.start, item.startDate);
    const duration = item.endDate
      ? getDaysDiff(item.startDate, item.endDate)
      : 1;

    return {
      left: (startOffset / totalDays) * 100,
      width: Math.max((duration / totalDays) * 100, 1),
    };
  };

  if (timelineItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-900 rounded-lg border border-gray-700">
        <p>該当するIssueが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      {/* Date Header */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        <div className="w-96 p-3 font-medium text-gray-200 border-r border-gray-700">
          Issue / Assignee
        </div>
        <div className="flex-1 relative overflow-hidden">
          <div className="flex h-full">
            {dateGrid.map((date) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={date.toISOString()}
                  className={`flex-1 p-2 text-center text-xs border-r border-gray-600 ${
                    isToday
                      ? "bg-green-500/20 text-green-300 font-bold border-green-400/50"
                      : isWeekend
                        ? "bg-gray-700 text-gray-400"
                        : "text-gray-300"
                  }`}
                  style={{ minWidth: "40px" }}
                >
                  {formatDateShort(date)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Issues */}
      <div className="divide-y divide-gray-700">
        {sortedItems.map((item) => {
          const position = getItemPosition(item);
          const assigneeColor = getAssigneeColor(item.assignee?.id);

          return (
            <div
              key={item.id}
              className="flex items-stretch hover:bg-gray-800/50 transition-colors min-h-16"
            >
              <div className="w-96 p-3 border-r border-gray-700">
                <div className="flex items-start space-x-3">
                  <span className="text-xs text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded flex-shrink-0 mt-0.5">
                    {item.identifier}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://linear.app/issue/${item.identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-100 hover:text-blue-400 hover:underline block leading-tight"
                      title={item.title}
                    >
                      {item.title}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-xs ${getStatusColor(item.state.type)}`}>
                    {item.state.name}
                  </span>
                  {item.assignee && (
                    <span className="text-xs text-gray-400">
                      • {item.assignee.displayName}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 relative bg-gray-800 min-h-16 overflow-hidden">
                {/* Date grid background */}
                <div className="absolute inset-0 flex h-full">
                  {dateGrid.map((date) => {
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <div
                        key={`bg-${date.toISOString()}`}
                        className={`flex-1 border-r border-gray-600 ${
                          isToday
                            ? "bg-green-500/10 border-green-400/30"
                            : isWeekend
                              ? "bg-gray-700/30"
                              : ""
                        }`}
                        style={{ minWidth: "40px" }}
                      />
                    );
                  })}
                </div>

                {/* Task bar */}
                {position.width > 0 && (
                  <div
                    className="absolute top-4 h-8 rounded-md shadow-lg border border-gray-600/50"
                    style={{
                      left: `${position.left}%`,
                      width: `${position.width}%`,
                      backgroundColor: assigneeColor,
                      opacity: 0.9,
                    }}
                  >
                    <div className="h-full rounded-md relative overflow-hidden">
                      {item.progress > 0 && (
                        <div
                          className="h-full bg-white/30 rounded-md"
                          style={{ width: `${item.progress}%` }}
                        />
                      )}

                      {/* Task label */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-xs text-white font-medium truncate drop-shadow-sm">
                          {item.title}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
