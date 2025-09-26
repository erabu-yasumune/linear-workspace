"use server";

import { LinearClient } from "@linear/sdk";
import { toISOString } from "@/utils/date";

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
