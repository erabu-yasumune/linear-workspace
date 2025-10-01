"use server";

import { LinearClient } from "@linear/sdk";
import { dateStringToUTCISOString, toISOString } from "@/utils/date";

if (!process.env.LINEAR_API_KEY) {
  throw new Error("LINEAR_API_KEY is not set in environment variables");
}

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});

// Add timeout wrapper for API calls
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`Operation timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeoutPromise]);
}

export interface LinearIssue {
  id: string;
  title: string;
  identifier: string;
  description?: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
    displayName: string;
  };
  cycle?: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  };
  parent?: {
    id: string;
    title: string;
    identifier: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  startedAt?: string;
  estimate?: number;
}

export interface LinearCycle {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  number: number;
}

export interface LinearUser {
  id: string;
  name: string;
  displayName: string;
  email: string;
}

export interface LinearTeam {
  id: string;
  key: string;
  name: string;
}

export async function getLinearIssues(): Promise<LinearIssue[]> {
  try {
    const issues = await withTimeout(
      linearClient.issues({
        includeArchived: false,
        first: 100,
      }),
      10000, // 10 second timeout
    );

    const validIssues: LinearIssue[] = [];

    for (const issue of issues.nodes) {
      try {
        const state = await issue.state;
        const assignee = await issue.assignee;
        const cycle = await issue.cycle;
        const parent = await issue.parent;

        // Skip issues without a state
        if (!state) {
          continue;
        }

        validIssues.push({
          id: issue.id,
          title: issue.title || "Untitled",
          identifier: issue.identifier,
          description: issue.description || undefined,
          state: {
            id: state.id,
            name: state.name,
            type: state.type,
          },
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name,
                displayName: assignee.displayName,
              }
            : undefined,
          cycle: cycle
            ? {
                id: cycle.id,
                name: cycle.name || `Cycle ${cycle.number || "Unknown"}`,
                startsAt: cycle.startsAt
                  ? toISOString(cycle.startsAt)
                  : toISOString(new Date()),
                endsAt: cycle.endsAt
                  ? toISOString(cycle.endsAt)
                  : toISOString(new Date()),
              }
            : undefined,
          parent: parent
            ? {
                id: parent.id,
                title: parent.title || "Untitled",
                identifier: parent.identifier,
              }
            : undefined,
          createdAt: toISOString(issue.createdAt),
          updatedAt: toISOString(issue.updatedAt),
          dueDate: issue.dueDate ? toISOString(issue.dueDate) : undefined,
          startedAt: issue.startedAt ? toISOString(issue.startedAt) : undefined,
          estimate: issue.estimate || undefined,
        });
      } catch (issueError) {}
    }

    return validIssues;
  } catch (error) {
    console.error("Failed to fetch issues from Linear:", error);
    if (error instanceof Error) {
      throw new Error(`Linear API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch issues from Linear API");
  }
}

export async function getLinearCycles(): Promise<LinearCycle[]> {
  try {
    const cycles = await withTimeout(
      linearClient.cycles({
        first: 50,
      }),
      10000, // 10 second timeout
    );

    return cycles.nodes.map((cycle) => ({
      id: cycle.id,
      name: cycle.name || `Cycle ${cycle.number || "Unknown"}`,
      startsAt: cycle.startsAt
        ? toISOString(cycle.startsAt)
        : toISOString(new Date()),
      endsAt: cycle.endsAt
        ? toISOString(cycle.endsAt)
        : toISOString(new Date()),
      number: cycle.number,
    }));
  } catch (error) {
    console.error("Failed to fetch cycles from Linear:", error);
    if (error instanceof Error) {
      throw new Error(`Linear API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch cycles from Linear API");
  }
}

export async function getLinearUsers(): Promise<LinearUser[]> {
  try {
    const users = await withTimeout(
      linearClient.users({
        first: 100,
      }),
      10000, // 10 second timeout
    );

    return users.nodes.map((user) => ({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      email: user.email,
    }));
  } catch (error) {
    console.error("Failed to fetch users from Linear:", error);
    if (error instanceof Error) {
      throw new Error(`Linear API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch users from Linear API");
  }
}

export async function getLinearTeams(): Promise<LinearTeam[]> {
  try {
    const teams = await withTimeout(
      linearClient.teams({
        first: 50,
      }),
      10000, // 10 second timeout
    );

    return teams.nodes.map((team) => ({
      id: team.id,
      key: team.key,
      name: team.name,
    }));
  } catch (error) {
    console.error("Failed to fetch teams from Linear:", error);
    if (error instanceof Error) {
      throw new Error(`Linear API Error: ${error.message}`);
    }
    throw new Error("Failed to fetch teams from Linear API");
  }
}

export interface BulkIssueInput {
  title: string;
  description?: string;
  cycleId?: string;
  estimate?: number;
  dueDate?: string;
  parentId?: string;
  assigneeId?: string;
}

export async function createBulkIssues(
  issues: BulkIssueInput[],
  teamId: string,
): Promise<void> {
  // Note: Validation is performed on the client side using Zod schema
  // This ensures type safety and prevents invalid data from being sent
  try {
    // Validate that the team exists
    const teams = await withTimeout(linearClient.teams(), 10000);
    const team = teams.nodes.find((t) => t.id === teamId);

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found in Linear workspace`);
    }

    // Create issues sequentially to avoid rate limiting
    const results = [];
    for (const issue of issues) {
      try {
        const issuePayload: {
          title: string;
          description?: string;
          teamId: string;
          cycleId?: string;
          estimate?: number;
          dueDate?: string;
          parentId?: string;
          assigneeId?: string;
        } = {
          title: issue.title,
          teamId: teamId,
        };

        if (issue.description) {
          issuePayload.description = issue.description;
        }
        if (issue.cycleId) {
          issuePayload.cycleId = issue.cycleId;
        }
        if (issue.estimate !== undefined) {
          issuePayload.estimate = issue.estimate;
        }
        if (issue.dueDate) {
          issuePayload.dueDate = dateStringToUTCISOString(issue.dueDate);
        }
        if (issue.parentId) {
          issuePayload.parentId = issue.parentId;
        }
        if (issue.assigneeId) {
          issuePayload.assigneeId = issue.assigneeId;
        }

        const result = await withTimeout(
          linearClient.createIssue(issuePayload),
          10000,
        );

        results.push(result);
      } catch (issueError) {
        console.error("Failed to create individual issue:", issueError);
        throw issueError;
      }
    }

    console.log(`Successfully created ${results.length} issues`);
  } catch (error) {
    console.error("Failed to create bulk issues:", error);
    if (error instanceof Error) {
      throw new Error(`Issue creation failed: ${error.message}`);
    }
    throw new Error("Failed to create issues in Linear");
  }
}
