export interface ProjectionPoint {
  month: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface ProjectionResult {
  points: ProjectionPoint[];
}

export interface ProjectionMilestone {
  label: string;
  months: number;
  netWorth: number;
}

export interface ProjectionResponse {
  currentNetWorth: number;
  milestones: ProjectionMilestone[];
  currentAge: number | null;
  retirementAge: number;
}
