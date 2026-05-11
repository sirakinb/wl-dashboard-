export type FunnelStatus =
  | "new-lead"
  | "no-viable-case"
  | "reschedule-needed"
  | "appointment-missed"
  | "sent-esign"
  | "signed-esign"
  | "missed";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  caseType?: string;
  practiceArea?: string;
  rawStatus: string;
  status: FunnelStatus | null;
  source?: string;
  createdAt: string;
  updatedAt: string;
  daysOpen: number;
}

export interface FunnelBucket {
  status: FunnelStatus;
  label: string;
  count: number;
  color: string;
  isMainFlow: boolean;
}

export interface FunnelData {
  buckets: FunnelBucket[];
  totalLeads: number;
  conversionRate: number;
  avgDaysToConvert: number | null;
  topSource: string | null;
  generatedAt: string;
}

export interface SourceCount {
  source: string;
  count: number;
  converted: number;
}

export interface DashboardResponse {
  funnel: FunnelData;
  sources: SourceCount[];
  leads: Lead[];
}
