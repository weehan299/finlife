export interface GoalProgress {
  goalId: string;
  percentComplete: number;
  amountRemaining: number;
  estimatedMonthsToTarget: number | null;
}
