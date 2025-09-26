"use client";

import { useMemo, useState, useTransition } from "react";
import {
  getLinearCycles,
  getLinearIssues,
  type LinearCycle,
  type LinearIssue,
} from "@/lib/actions";
import { GanttChart } from "./GanttChart";
import { LoadingSpinner } from "./LoadingSpinner";
import { SyncButton } from "./SyncButton";
import { FilterControls } from "./ViewToggle";

interface LinearWorkspaceProps {
  initialIssues: LinearIssue[];
  initialCycles: LinearCycle[];
}

export function LinearWorkspace({
  initialIssues,
  initialCycles,
}: LinearWorkspaceProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [cycles, setCycles] = useState(initialCycles);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      try {
        const [newIssues, newCycles] = await Promise.all([
          getLinearIssues(),
          getLinearCycles(),
        ]);
        setIssues(newIssues);
        setCycles(newCycles);
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

  return (
    <>
      {/* Controls */}
      <div className="border-b border-gray-800 bg-[#1c1c1e] -mx-6 px-6 py-4 mb-8">
        <div className="flex items-center justify-between">
          <FilterControls
            cycles={cycles}
            issues={issues}
            selectedCycle={selectedCycle}
            selectedAssignee={selectedAssignee}
            onCycleChange={setSelectedCycle}
            onAssigneeChange={setSelectedAssignee}
            isLoading={isPending}
          />
          <SyncButton
            onSync={handleSync}
            loading={isPending}
            lastSync={lastSync}
          />
        </div>
      </div>

      {/* Main Content */}
      {isPending ? (
        <LoadingSpinner
          size="lg"
          message="データを同期しています..."
          className="py-12"
        />
      ) : (
        <GanttChart
          issues={filteredIssues}
          selectedCycle={
            selectedCycle ? cycles.find((c) => c.id === selectedCycle) : null
          }
        />
      )}
    </>
  );
}
