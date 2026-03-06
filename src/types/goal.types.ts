export interface SerializedGoalAllocation {
  id: string;
  assetId: string;
  assetLabel: string;
  assetValue: number;
  mode: string;
  allocationValue: number | null;
  effectiveValue: number;
}

export interface SerializedGoal {
  id: string;
  type: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  startingAmount: number;
  monthlyContribution: number;
  provenance: string;
  createdAt: string;
  updatedAt: string;
  allocations: SerializedGoalAllocation[];
}

export interface GoalProgress {
  goalId: string;
  currentAmount: number;
  percentComplete: number;
  amountRemaining: number;
  estimatedMonthsToTarget: number | null;
}

export interface GoalWithProgress extends SerializedGoal {
  progress: GoalProgress;
}

export interface GoalImpactSummary {
  id: string;
  decisionId: string;
  decisionName: string;
  projectedDelayMonths: number | null;
  deltaToTarget: number | null;
}
