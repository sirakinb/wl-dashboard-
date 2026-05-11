import {
  BRANCH_ORDER,
  FUNNEL_ORDER,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./status-mapping";
import type { DashboardResponse, FunnelBucket, FunnelData, Lead, SourceCount } from "./types";

export function buildFunnel(leads: Lead[]): FunnelData {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    if (lead.status) counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }

  const buckets: FunnelBucket[] = [...FUNNEL_ORDER, ...BRANCH_ORDER].map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: counts.get(status) ?? 0,
    color: STATUS_COLORS[status],
    isMainFlow: FUNNEL_ORDER.includes(status),
  }));

  const signed = counts.get("signed-esign") ?? 0;
  const totalLeads = leads.length;
  const converted = leads.filter((lead) => lead.status === "signed-esign");
  const avgDaysToConvert = converted.length
    ? converted.reduce((sum, lead) => sum + lead.daysOpen, 0) / converted.length
    : null;

  return {
    buckets,
    totalLeads,
    conversionRate: totalLeads ? Math.round((signed / totalLeads) * 1000) / 10 : 0,
    avgDaysToConvert: avgDaysToConvert === null ? null : Math.round(avgDaysToConvert * 10) / 10,
    topSource:
      buildSources(leads).find((source) => source.source !== "Unknown")?.source ??
      buildSources(leads)[0]?.source ??
      null,
    generatedAt: new Date().toISOString(),
  };
}

export function buildSources(leads: Lead[]): SourceCount[] {
  const sourceMap = new Map<string, SourceCount>();

  for (const lead of leads) {
    const source = lead.source || "Unknown";
    const current = sourceMap.get(source) ?? { source, count: 0, converted: 0 };
    current.count += 1;
    if (lead.status === "signed-esign") current.converted += 1;
    sourceMap.set(source, current);
  }

  return [...sourceMap.values()].sort((a, b) => b.count - a.count);
}

export function buildDashboardResponse(leads: Lead[]): DashboardResponse {
  return {
    funnel: buildFunnel(leads),
    sources: buildSources(leads),
    leads,
  };
}
