"use client";

import { useMemo, useState, useTransition } from "react";
import {
  getLinearCycles,
  getLinearIssues,
  getLinearTeams,
  getLinearUsers,
  type LinearCycle,
  type LinearIssue,
  type LinearTeam,
  type LinearUser,
} from "@/lib/actions";
import { BulkIssueForm } from "./BulkIssueForm";
import { BurndownChart } from "./BurndownChart";
import { GanttChart } from "./GanttChart";
import { LoadingSpinner } from "./LoadingSpinner";
import { SyncButton } from "./SyncButton";
import { FilterControls } from "./ViewToggle";

interface LinearWorkspaceProps {
  initialIssues: LinearIssue[];
  initialCycles: LinearCycle[];
  initialUsers: LinearUser[];
  initialTeams: LinearTeam[];
}

type TabType = "chart" | "bulk-create";

export function LinearWorkspace({
  initialIssues,
  initialCycles,
  initialUsers,
  initialTeams,
}: LinearWorkspaceProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [cycles, setCycles] = useState(initialCycles);
  const [users, setUsers] = useState(initialUsers);
  const [teams, setTeams] = useState(initialTeams);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>("chart");

  const handleSync = () => {
    startTransition(async () => {
      try {
        const [newIssues, newCycles, newUsers, newTeams] = await Promise.all([
          getLinearIssues(),
          getLinearCycles(),
          getLinearUsers(),
          getLinearTeams(),
        ]);
        setIssues(newIssues);
        setCycles(newCycles);
        setUsers(newUsers);
        setTeams(newTeams);
        setLastSync(new Date());
      } catch (error) {
        console.error("Sync failed:", error);
      }
    });
  };

  // Filter issues by selected cycle and assignee
  const filteredIssues = useMemo(() => {
    let filtered = issues;

    // Filter by cycle
    if (selectedCycle) {
      filtered = filtered.filter((issue) => issue.cycle?.id === selectedCycle);
    }

    // Filter by assignee
    if (selectedAssignee) {
      if (selectedAssignee === "unassigned") {
        filtered = filtered.filter((issue) => !issue.assignee);
      } else {
        filtered = filtered.filter(
          (issue) => issue.assignee?.id === selectedAssignee,
        );
      }
    }

    return filtered;
  }, [issues, selectedCycle, selectedAssignee]);

  const handleBulkCreateSuccess = () => {
    // Sync data after successful bulk creation
    handleSync();
    // Switch back to chart tab
    setActiveTab("chart");
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-gray-800 bg-[#1c1c1e] -mx-4 px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === "chart"
                  ? "bg-[#2c2c2e] text-white border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-white hover:bg-[#2c2c2e]/50"
              }`}
            >
              チャート表示
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bulk-create")}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === "bulk-create"
                  ? "bg-[#2c2c2e] text-white border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-white hover:bg-[#2c2c2e]/50"
              }`}
            >
              Issue一括登録
            </button>
          </div>
          <SyncButton
            onSync={handleSync}
            loading={isPending}
            lastSync={lastSync}
          />
        </div>

        {/* Filters (only show in chart tab) */}
        {activeTab === "chart" && (
          <div className="pb-4">
            <FilterControls
              cycles={cycles}
              issues={issues}
              selectedCycle={selectedCycle}
              selectedAssignee={selectedAssignee}
              onCycleChange={setSelectedCycle}
              onAssigneeChange={setSelectedAssignee}
              isLoading={isPending}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {isPending ? (
        <LoadingSpinner
          size="lg"
          message="データを同期しています..."
          className="py-12"
        />
      ) : activeTab === "chart" ? (
        <div className="space-y-8">
          {/* バーダウンチャート (常に上に配置) */}
          <div>
            <BurndownChart
              issues={filteredIssues}
              selectedCycle={
                selectedCycle
                  ? cycles.find((c) => c.id === selectedCycle)
                  : null
              }
            />
          </div>

          {/* ガントチャート (常に下に配置) */}
          <div>
            <GanttChart
              issues={filteredIssues}
              selectedCycle={
                selectedCycle
                  ? cycles.find((c) => c.id === selectedCycle)
                  : null
              }
            />
          </div>
        </div>
      ) : (
        <div>
          <BulkIssueForm
            cycles={cycles}
            users={users}
            teams={teams}
            issues={issues.map((issue) => ({
              id: issue.id,
              title: issue.title,
              identifier: issue.identifier,
            }))}
            onSuccess={handleBulkCreateSuccess}
          />
        </div>
      )}
    </>
  );
}
