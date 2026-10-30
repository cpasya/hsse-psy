// Frontend view model only, not a claim about a backend endpoint/schema.
// Populate exclusively from a verified real API adapter; no seed/default data.
export interface DashboardSnapshot {
  updatedAt: string;
  metrics: {
    incidents: number | null;
    openActions: number | null;
    highRisks: number | null;
    inspectionCompletion: number | null;
  };
}
