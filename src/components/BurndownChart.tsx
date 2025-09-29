"use client";

import { useMemo } from "react";
import { PROGRESS_BY_STATE } from "@/consts";
import type { LinearCycle, LinearIssue } from "@/lib/actions";
import { formatDateShort, generateDateGrid, parseDate, getToday } from "@/utils/date";

interface BurndownChartProps {
  issues: LinearIssue[];
  selectedCycle?: LinearCycle | null;
}

interface BurndownDataPoint {
  date: string;
  plannedRemaining: number;
  actualRemaining: number;
  totalPlanned: number;
}

function getProgressFromState(stateType: string): number {
  if (stateType in PROGRESS_BY_STATE) {
    return PROGRESS_BY_STATE[stateType as keyof typeof PROGRESS_BY_STATE];
  }
  return PROGRESS_BY_STATE.default;
}

export function BurndownChart({ issues, selectedCycle }: BurndownChartProps) {
  // 時間範囲の計算
  const timeRange = useMemo(() => {
    if (selectedCycle) {
      const cycleStart = parseDate(selectedCycle.startsAt).startOf("day");
      const cycleEnd = parseDate(selectedCycle.endsAt).endOf("day");
      return {
        start: cycleStart,
        end: cycleEnd,
      };
    }

    // サイクル未選択時は課題の期間から算出
    const allDates = issues
      .flatMap((issue) => [issue.dueDate || issue.createdAt, issue.createdAt])
      .filter(Boolean) as string[];

    if (allDates.length === 0) {
      const today = parseDate(new Date());
      return {
        start: today.startOf("day"),
        end: today.add(30, "day").endOf("day"),
      };
    }

    const dates = allDates.map(parseDate);
    const minDate = dates.reduce((min, date) =>
      date.isBefore(min) ? date : min,
    );
    const maxDate = dates.reduce((max, date) =>
      date.isAfter(max) ? date : max,
    );

    return {
      start: minDate.startOf("day"),
      end: maxDate.endOf("day"),
    };
  }, [selectedCycle, issues]);

  // バーンダウンデータの計算
  const burndownData = useMemo(() => {
    // 日付グリッドを生成
    const dateGrid = generateDateGrid(timeRange.start, timeRange.end);

    // 総ポイント数を計算
    const totalPlanned = issues.reduce(
      (sum, issue) => sum + (issue.estimate || 1),
      0,
    );

    // 各日付での残りポイントを計算
    const dataPoints: BurndownDataPoint[] = dateGrid.map((date) => {
      const dateStr = date.toISOString();

      // 計画線: dueDateを元に計算
      let plannedCompletedPoints = 0;

      if (selectedCycle) {
        // サイクルが指定されている場合、サイクル最終日に全て完了する前提で調整
        const cycleEnd = parseDate(selectedCycle.endsAt);

        issues.forEach((issue) => {
          let targetDueDate: ReturnType<typeof parseDate>;

          if (issue.dueDate) {
            const issueDueDate = parseDate(issue.dueDate);
            // dueDateがサイクル期間外の場合はサイクル最終日に調整
            targetDueDate = issueDueDate.isAfter(cycleEnd)
              ? cycleEnd
              : issueDueDate;
          } else {
            // dueDateがないタスクはサイクル最終日に完了予定
            targetDueDate = cycleEnd;
          }

          if (
            targetDueDate.isBefore(date) ||
            targetDueDate.isSame(date, "day")
          ) {
            plannedCompletedPoints += issue.estimate || 1;
          }
        });
      } else {
        // サイクル未指定の場合は従来通り
        issues.forEach((issue) => {
          if (issue.dueDate) {
            const dueDate = parseDate(issue.dueDate);
            if (dueDate.isBefore(date) || dueDate.isSame(date, "day")) {
              plannedCompletedPoints += issue.estimate || 1;
            }
          } else {
            // 推定期間での計算
            const createdDate = parseDate(issue.createdAt);
            const estimatedDays = Math.max(3, (issue.estimate || 1) * 2);
            const estimatedDueDate = createdDate.add(estimatedDays, "day");

            if (
              estimatedDueDate.isBefore(date) ||
              estimatedDueDate.isSame(date, "day")
            ) {
              plannedCompletedPoints += issue.estimate || 1;
            }
          }
        });
      }

      const plannedRemaining = Math.max(
        0,
        totalPlanned - plannedCompletedPoints,
      );

      // 実際線: その日時点で完了したタスクのポイント数を差し引く
      let completedPoints = 0;
      issues.forEach((issue) => {
        const progress = getProgressFromState(issue.state.type);
        if (progress === 100) {
          // 完了したタスクは、updatedAtが現在日以前なら完了とみなす
          const completionDate = issue.updatedAt;
          let effectiveCompletionDate = parseDate(completionDate);

          // サイクル指定時、完了日がサイクル期間外の場合は適切に調整
          if (selectedCycle) {
            const cycleStart = parseDate(selectedCycle.startsAt);
            const cycleEnd = parseDate(selectedCycle.endsAt);

            // 完了日がサイクル開始前の場合はサイクル開始日とする
            if (effectiveCompletionDate.isBefore(cycleStart)) {
              effectiveCompletionDate = cycleStart;
            }
            // 完了日がサイクル終了後の場合はサイクル終了日とする
            else if (effectiveCompletionDate.isAfter(cycleEnd)) {
              effectiveCompletionDate = cycleEnd;
            }
          }

          if (
            effectiveCompletionDate.isBefore(date) ||
            effectiveCompletionDate.isSame(date, "day")
          ) {
            completedPoints += issue.estimate || 1;
          }
        }
      });

      const actualRemaining = Math.max(0, totalPlanned - completedPoints);

      return {
        date: dateStr,
        plannedRemaining,
        actualRemaining,
        totalPlanned,
      };
    });

    return dataPoints;
  }, [issues, timeRange, selectedCycle]);

  const dataPoints = burndownData;

  // 今日の日付を取得
  const today = useMemo(() => getToday(), []);

  // 今日の位置を計算（データポイント内のインデックスを求める）
  const todayIndex = useMemo(() => {
    return dataPoints.findIndex((d) => {
      const dataDate = parseDate(d.date).startOf("day");
      return dataDate.isSame(today, "day");
    });
  }, [dataPoints, today]);

  // SVGの描画設定
  const chartWidth = 1200;
  const chartHeight = 500;
  const padding = { top: 20, right: 40, bottom: 60, left: 60 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const maxY = Math.max(
    1,
    ...dataPoints.map((d) =>
      Math.max(d.plannedRemaining, d.actualRemaining, d.totalPlanned),
    ),
  );
  const scaleY = (value: number) =>
    padding.top + (1 - value / maxY) * graphHeight;
  const scaleX = (index: number) => {
    if (dataPoints.length <= 1) {
      return padding.left + graphWidth / 2;
    }
    return padding.left + (index / (dataPoints.length - 1)) * graphWidth;
  };

  // 計画線のパス
  const plannedPath = dataPoints
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.plannedRemaining)}`,
    )
    .join(" ");

  // 実際線のパス
  const actualPath = dataPoints
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.actualRemaining)}`,
    )
    .join(" ");

  if (issues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-900 rounded-lg border border-gray-700">
        <p>該当するIssueが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h3 className="text-lg font-medium text-gray-200">
          バーンダウンチャート
        </h3>
        <p className="text-sm text-gray-400">
          総ポイント: {dataPoints[0]?.totalPlanned || 0} • 残りポイント:{" "}
          {dataPoints[dataPoints.length - 1]?.actualRemaining?.toFixed(1) || 0}{" "}
          • {selectedCycle ? "サイクル完了目標" : "Due Dateベース"}
        </p>
      </div>

      {/* Chart */}
      <div className="p-6">
        <svg
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto"
          role="img"
          aria-label="バーンダウンチャート - 計画線と実際の進捗を表示"
        >
          <title>バーンダウンチャート</title>
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#374151"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            x={padding.left}
            y={padding.top}
            width={graphWidth}
            height={graphHeight}
            fill="url(#grid)"
          />

          {/* Y軸ラベル */}
          {Array.from({ length: 6 }, (_, i) => {
            const value = (maxY * i) / 5;
            const y = scaleY(value);
            return (
              <g key={`y-axis-${value}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + graphWidth}
                  y2={y}
                  stroke="#4B5563"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  {value.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X軸ラベル */}
          {dataPoints.map((d, i) => {
            if (i % Math.ceil(dataPoints.length / 8) === 0) {
              const x = scaleX(i);
              return (
                <g key={`x-axis-${d.date}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="#4B5563"
                    strokeWidth="0.5"
                  />
                  <text
                    x={x}
                    y={padding.top + graphHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-400"
                  >
                    {formatDateShort(parseDate(d.date))}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* 計画線 */}
          <path
            d={plannedPath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* 実際線 */}
          <path d={actualPath} fill="none" stroke="#EF4444" strokeWidth="3" />

          {/* 今日の縦線 */}
          {todayIndex >= 0 && (
            <g>
              <line
                x1={scaleX(todayIndex)}
                y1={padding.top}
                x2={scaleX(todayIndex)}
                y2={padding.top + graphHeight}
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="3,3"
              />
              <text
                x={scaleX(todayIndex)}
                y={padding.top - 5}
                textAnchor="middle"
                className="text-xs fill-green-400 font-medium"
              >
                Today
              </text>
            </g>
          )}

          {/* データポイント */}
          {dataPoints.map((d, i) => {
            if (i % Math.ceil(dataPoints.length / 10) === 0) {
              return (
                <g key={`data-point-${d.date}`}>
                  {/* 計画線のポイント */}
                  <circle
                    cx={scaleX(i)}
                    cy={scaleY(d.plannedRemaining)}
                    r="4"
                    fill="#3B82F6"
                    stroke="#1F2937"
                    strokeWidth="2"
                  />
                  {/* 実際線のポイント */}
                  <circle
                    cx={scaleX(i)}
                    cy={scaleY(d.actualRemaining)}
                    r="4"
                    fill="#EF4444"
                    stroke="#1F2937"
                    strokeWidth="2"
                  />
                </g>
              );
            }
            return null;
          })}

          {/* 軸ラベル */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 10}
            textAnchor="middle"
            className="text-sm fill-gray-300"
          >
            日付
          </text>
          <text
            x={20}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${chartHeight / 2})`}
            className="text-sm fill-gray-300"
          >
            残りポイント
          </text>
        </svg>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0 border-t-2 border-dashed border-blue-400"></div>
            <span className="text-sm text-gray-400">
              計画線 ({selectedCycle ? "サイクル完了目標" : "Due Dateベース"})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0 border-t-2 border-red-400"></div>
            <span className="text-sm text-gray-400">実際線 (完了ベース)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0 border-t-2 border-dashed border-green-400"></div>
            <span className="text-sm text-gray-400">今日</span>
          </div>
        </div>
      </div>
    </div>
  );
}
