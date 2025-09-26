import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { LinearWorkspace } from "@/components/LinearWorkspace";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  getLinearCycles,
  getLinearIssues,
  type LinearCycle,
  type LinearIssue,
} from "@/lib/actions";

export default async function Home() {
  let issues: LinearIssue[];
  let cycles: LinearCycle[];
  let error: string | null = null;

  try {
    const [issuesResult, cyclesResult] = await Promise.all([
      getLinearIssues(),
      getLinearCycles(),
    ]);
    issues = issuesResult;
    cycles = cyclesResult;
  } catch (err) {
    console.error("Failed to fetch Linear data:", err);
    error = err instanceof Error ? err.message : "Unknown error occurred";

    // Fallback to mock data for development
    issues = [
      {
        id: "mock-1",
        title: "Mock Issue 1",
        identifier: "MOCK-1",
        description: "This is a mock issue for testing",
        state: {
          id: "state-1",
          name: "In Progress",
          type: "started",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    cycles = [];
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <form action="">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              再試行
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white flex items-center space-x-2">
              <span>Linear Gantt</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <LoadingSpinner
              size="lg"
              message="Linearからデータを読み込んでいます..."
              className="py-16"
            />
          }
        >
          <LinearWorkspace initialIssues={issues} initialCycles={cycles} />
        </Suspense>
      </main>
    </div>
  );
}
