import type { FunnelStatus } from "./types";

export const STATUS_MAP: Record<string, FunnelStatus> = {
  "New Lead": "new-lead",
  "Contact Attempted": "new-lead",
  "Scheduled Consult": "scheduled-consult",
  "Appointment Confirmed": "scheduled-consult",
  "Consultation Complete": "scheduled-consult",
  "No Viable Case": "no-viable-case",
  "DLR Prescreened as Not Viable": "no-viable-case",
  "Reschedule Needed": "reschedule-needed",
  "Appointment Missed": "appointment-missed",
  "Sent e-Sign": "sent-esign",
  "Sent eSign": "sent-esign",
  "Sent E-sign": "sent-esign",
  "Signed e-Sign": "converted",
  "Signed eSign": "converted",
  "Signed E-sign": "converted",
  Converted: "converted",
  "Converted to Case": "converted",
  "Converted to Case - Approved": "converted",
  Retained: "converted",
  Missed: "missed",
  Unresponsive: "missed",
  "Did Not Hire": "missed",
  "Unable to afford": "missed",
};

export const FUNNEL_ORDER: FunnelStatus[] = [
  "new-lead",
  "scheduled-consult",
  "sent-esign",
  "converted",
];

export const BRANCH_ORDER: FunnelStatus[] = [
  "no-viable-case",
  "reschedule-needed",
  "appointment-missed",
  "missed",
];

export const STATUS_LABELS: Record<FunnelStatus, string> = {
  "new-lead": "New Lead",
  "no-viable-case": "No Viable Case",
  "reschedule-needed": "Reschedule Needed",
  "appointment-missed": "Appointment Missed",
  "scheduled-consult": "Appointment",
  "sent-esign": "Sent e-Sign",
  "signed-esign": "Signed e-Sign",
  converted: "Converted",
  missed: "Lost / Unresponsive",
};

export const STATUS_COLORS: Record<FunnelStatus, string> = {
  "new-lead": "#1E3A8A",
  "no-viable-case": "#9CA3AF",
  "reschedule-needed": "#D97706",
  "appointment-missed": "#DC2626",
  "scheduled-consult": "#7C3AED",
  "sent-esign": "#7C3AED",
  "signed-esign": "#059669",
  converted: "#059669",
  missed: "#6B7280",
};

export function cleanStatus(raw: string | null | undefined) {
  return String(raw ?? "Unknown")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapStatus(raw: string | null | undefined): FunnelStatus | null {
  return STATUS_MAP[cleanStatus(raw)] ?? null;
}
