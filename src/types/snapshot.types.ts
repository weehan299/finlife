export interface ProjectionPoint {
  month: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface ProjectionResult {
  points: ProjectionPoint[];
}
