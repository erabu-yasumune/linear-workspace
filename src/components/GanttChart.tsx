"use client";

import { useMemo } from "react";
import {
  ASSIGNEE_COLORS,
  DEFAULT_ASSIGNEE_COLOR,
  HIERARCHY_INDENT_PX,
  HIERARCHY_SEPARATOR,
  HIERARCHY_SYMBOLS,
  MIN_COLUMN_WIDTH_PX,
  PROGRESS_BY_STATE,
  STATE_COLORS,
  STATE_TYPE_PRIORITY,
  UNASSIGNED_SORT_KEY,
} from "@/consts";
import type { LinearCycle, LinearIssue } from "@/lib/actions";
import {
  formatDateShort,
  generateDateGrid,
  getDaysDiff,
  getEndOfToday,
  getMaxDate,
  getMinDate,
  isToday,
  isWeekend,
  parseDate,
} from "@/utils/date";

interface GanttChartProps {
  issues: LinearIssue[];
  selectedCycle?: LinearCycle | null;
}

interface TimelineItem {
  id: string;
  title: string;
  identifier: string;
  assignee?: { id: string; displayName: string; name: string };
  startDate: string | null;
  endDate: string | null;
  state: {
    name: string;
    type: string;
  };
  progress: number;
  estimate?: number;
  parent?: {
    id: string;
    title: string;
    identifier: string;
  };
  isParentTask?: boolean;
  hasChildren?: boolean;
  hierarchyLevel?: number; // 0 = top level, 1 = child, 2 = grandchild, etc.
  hierarchyPath?: string; // Full path for proper sorting
}

function getProgressFromState(stateType: string): number {
  if (stateType in PROGRESS_BY_STATE) {
    return PROGRESS_BY_STATE[stateType as keyof typeof PROGRESS_BY_STATE];
  }
  return PROGRESS_BY_STATE.default;
}

// Assignee-based color generation
function getAssigneeColor(assigneeId: string | undefined): string {
  if (!assigneeId) return DEFAULT_ASSIGNEE_COLOR;

  // Simple hash function to get consistent color for same assignee
  let hash = 0;
  for (let i = 0; i < assigneeId.length; i++) {
    hash = assigneeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length];
}

function getStatusColor(stateType: string): string {
  if (stateType in STATE_COLORS) {
    return STATE_COLORS[stateType as keyof typeof STATE_COLORS];
  }
  return STATE_COLORS.default;
}

// Removed - now using utility function from @/utils/date

export function GanttChart({ issues, selectedCycle }: GanttChartProps) {
  const timelineItems = useMemo(() => {
    const today = getEndOfToday();

    // Create a map to track parent-child relationships
    const parentChildMap = new Map<string, string[]>();
    const allIssueIds = new Set(issues.map((issue) => issue.id));
    const issueMap = new Map(issues.map((issue) => [issue.id, issue]));

    // Build parent-child relationship map
    issues.forEach((issue) => {
      if (issue.parent && allIssueIds.has(issue.parent.id)) {
        if (!parentChildMap.has(issue.parent.id)) {
          parentChildMap.set(issue.parent.id, []);
        }
        parentChildMap.get(issue.parent.id)!.push(issue.id);
      }
    });

    // Function to calculate hierarchy level and path
    const calculateHierarchy = (
      issue: LinearIssue,
    ): { level: number; path: string } => {
      let level = 0;
      const path: string[] = [];
      let currentIssue = issue;

      // Walk up the parent chain to calculate depth and build path
      while (currentIssue.parent && issueMap.has(currentIssue.parent.id)) {
        level++;
        path.unshift(currentIssue.parent.identifier);
        currentIssue = issueMap.get(currentIssue.parent.id)!;
      }

      // Add current issue identifier to path
      path.push(issue.identifier);

      return {
        level,
        path: path.join(HIERARCHY_SEPARATOR),
      };
    };

    return issues.map((issue) => {
      let startDate: string | null = null;
      let endDate: string | null = null;

      // Determine base start date (startedAt takes priority over createdAt)
      let baseStartDate = issue.startedAt || issue.createdAt;

      // If a specific cycle is selected and startedAt is not available,
      // check if createdAt is outside the cycle period
      if (selectedCycle && !issue.startedAt) {
        const createdDate = parseDate(issue.createdAt);
        const cycleStart = parseDate(selectedCycle.startsAt);
        const cycleEnd = parseDate(selectedCycle.endsAt);

        // If created before cycle starts, use cycle start date
        if (createdDate.isBefore(cycleStart)) {
          baseStartDate = cycleStart.toISOString();
        }
        // If created after cycle ends, keep original createdAt
        // (this maintains the original behavior for late creation)
      }

      if (issue.dueDate) {
        startDate = baseStartDate;
        endDate = issue.dueDate;
      } else {
        // If no due date, use adjusted start date and today for end
        startDate = baseStartDate;
        endDate = today.toISOString();
      }

      // Check if this issue is a parent task (has children)
      const hasChildren = parentChildMap.has(issue.id);

      // Calculate hierarchy information
      const hierarchy = calculateHierarchy(issue);

      return {
        id: issue.id,
        title: issue.title,
        identifier: issue.identifier,
        assignee: issue.assignee,
        startDate,
        endDate,
        state: issue.state,
        progress: getProgressFromState(issue.state.type),
        estimate: issue.estimate,
        parent: issue.parent,
        isParentTask: hasChildren,
        hasChildren,
        hierarchyLevel: hierarchy.level,
        hierarchyPath: hierarchy.path,
      };
    });
  }, [issues, selectedCycle]);

  // Sort items by assignee, then group parent tasks before their children
  const sortedItems = useMemo(() => {
    return timelineItems.sort((a, b) => {
      // First sort by assignee (unassigned items go to the end)
      const aAssignee = a.assignee?.displayName || UNASSIGNED_SORT_KEY;
      const bAssignee = b.assignee?.displayName || UNASSIGNED_SORT_KEY;

      if (aAssignee !== bAssignee) {
        return aAssignee.localeCompare(bAssignee);
      }

      // Within same assignee, sort by hierarchy path to maintain parent-child-grandchild order
      if (
        a.hierarchyPath &&
        b.hierarchyPath &&
        a.hierarchyPath !== b.hierarchyPath
      ) {
        return a.hierarchyPath.localeCompare(b.hierarchyPath);
      }

      // If both are children of the same parent or both standalone, sort by other criteria
      const aStartDate = a.startDate ? parseDate(a.startDate).valueOf() : 0;
      const bStartDate = b.startDate ? parseDate(b.startDate).valueOf() : 0;

      if (aStartDate !== bStartDate) {
        if (aStartDate === 0 && bStartDate !== 0) return -1;
        if (aStartDate !== 0 && bStartDate === 0) return 1;
        return aStartDate - bStartDate;
      }

      // Same start date - sort by state priority
      const aPriority = STATE_TYPE_PRIORITY[a.state.type] ?? 999;
      const bPriority = STATE_TYPE_PRIORITY[b.state.type] ?? 999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Finally sort by identifier
      return a.identifier.localeCompare(b.identifier);
    });
  }, [timelineItems]);

  const timeRange = useMemo(() => {
    // If a cycle is selected, use the cycle's period
    if (selectedCycle) {
      const cycleStart = parseDate(selectedCycle.startsAt).startOf("day");
      const cycleEnd = parseDate(selectedCycle.endsAt).endOf("day");

      return {
        start: cycleStart.toISOString(),
        end: cycleEnd.toISOString(),
      };
    }

    // Default behavior when no cycle is selected - use all issue dates
    const allDates = timelineItems
      .flatMap((item) => [item.startDate, item.endDate])
      .filter(Boolean) as string[];

    if (allDates.length === 0) {
      const today = parseDate(new Date());
      return {
        start: today.startOf("day").toISOString(),
        end: today.endOf("day").toISOString(),
      };
    }

    const minDate = getMinDate(allDates);
    const maxDate = getMaxDate(allDates);

    // Use startOf/endOf day for consistent alignment like cycle selection
    const start = minDate.startOf("day");
    const end = maxDate.endOf("day");

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [timelineItems, selectedCycle]);

  // Generate date grid for header
  const dateGrid = useMemo(() => {
    return generateDateGrid(
      parseDate(timeRange.start),
      parseDate(timeRange.end),
    );
  }, [timeRange]);

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
              const isTodayCheck = isToday(date);
              const isWeekendCheck = isWeekend(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`flex-1 p-2 text-center text-xs border-r border-gray-600 ${
                    isTodayCheck
                      ? "bg-green-500/20 text-green-300 font-bold border-green-400/50"
                      : isWeekendCheck
                        ? "bg-gray-700 text-gray-400"
                        : "text-gray-300"
                  }`}
                  style={{ minWidth: `${MIN_COLUMN_WIDTH_PX}px` }}
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
                <div className="flex items-start space-x-2">
                  {/* Hierarchy indicator with tree lines */}
                  <div
                    className="flex items-center space-x-1"
                    style={{
                      paddingLeft:
                        item.hierarchyLevel && item.hierarchyLevel > 0
                          ? `${item.hierarchyLevel * HIERARCHY_INDENT_PX}px`
                          : "0px",
                    }}
                  >
                    {item.hierarchyLevel !== undefined &&
                    item.hierarchyLevel > 0 ? (
                      <span className="text-gray-400 text-xs font-mono">
                        {HIERARCHY_SYMBOLS.CHILD_PREFIX}
                      </span>
                    ) : null}
                    <span className="text-xs font-mono px-2 py-1 rounded flex-shrink-0 mt-0.5 text-gray-300 bg-gray-700">
                      {item.identifier}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://linear.app/issue/${item.identifier}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-blue-400 hover:underline block leading-tight text-gray-100"
                      title={item.title}
                    >
                      {item.title}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`text-xs ${getStatusColor(item.state.type)}`}
                  >
                    {item.state.name}
                  </span>
                  {item.assignee && (
                    <span className="text-xs text-gray-400">
                      • {item.assignee.displayName}
                    </span>
                  )}
                  {item.estimate && (
                    <span className="text-xs text-blue-400 font-medium">
                      • {item.estimate}pt
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 relative bg-gray-800 min-h-16 overflow-hidden">
                {/* Date grid background */}
                <div className="absolute inset-0 flex h-full">
                  {dateGrid.map((date) => {
                    const isTodayCheck = isToday(date);
                    const isWeekendCheck = isWeekend(date);

                    return (
                      <div
                        key={`bg-${date.toISOString()}`}
                        className={`flex-1 border-r border-gray-600 ${
                          isTodayCheck
                            ? "bg-green-500/10 border-green-400/30"
                            : isWeekendCheck
                              ? "bg-gray-700/30"
                              : ""
                        }`}
                        style={{ minWidth: `${MIN_COLUMN_WIDTH_PX}px` }}
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
