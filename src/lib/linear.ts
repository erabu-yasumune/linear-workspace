// This file now only exports types - server actions moved to actions.ts
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
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimate?: number;
}

export interface LinearCycle {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  number: number;
}
