import { Suspense } from "react";
import { cookies } from "next/headers";
import { ThemeSelect } from "@/app/_components/ThemeSelect";
import { THEMES, type ThemeKey } from "@/app/actions/theme.types";
import { Icon } from "@/components/Icon";
import { LinearWorkspace } from "@/components/LinearWorkspace";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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

export default async function Home() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const theme: ThemeKey =
    themeCookie && THEMES.includes(themeCookie as ThemeKey)
      ? (themeCookie as ThemeKey)
      : "black";
  let issues: LinearIssue[];
  let cycles: LinearCycle[];
  let users: LinearUser[];
  let teams: LinearTeam[];
  let error: string | null = null;

  try {
    const [issuesResult, cyclesResult, usersResult, teamsResult] =
      await Promise.all([
        getLinearIssues(),
        getLinearCycles(),
        getLinearUsers(),
        getLinearTeams(),
      ]);
    issues = issuesResult;
    cycles = cyclesResult;
    users = usersResult;
    teams = teamsResult;
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
    users = [];
    teams = [];
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
          <p className="opacity-60 mb-4">{error}</p>
          <form action="">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-80 transition-opacity"
            >
              再試行
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center space-x-2">
              <span>Linear Gantt</span>
            </h1>
            <ThemeSelect initialTheme={theme} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <LoadingSpinner
              size="lg"
              message="Linearからデータを読み込んでいます..."
              className="py-16"
            />
          }
        >
          <LinearWorkspace
            initialIssues={issues}
            initialCycles={cycles}
            initialUsers={users}
            initialTeams={teams}
          />
        </Suspense>
      </main>
    </div>
  );
}
