import "server-only";

import { differenceInCalendarDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { mapStatus } from "./status-mapping";
import type { FunnelStatus, Lead, SourceCount } from "./types";

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const leadDetailCache = new Map<string, { expiresAt: number; value: LeadDetail | null }>();
const SOURCE_ENRICHMENT_LIMIT = 5;
const CASE_TYPE_IDS: Record<string, number[]> = {
  DLR: [109],
  PI: [89, 129, 131],
};
const STATUS_IDS: Partial<Record<FunnelStatus, number[]>> = {
  "new-lead": [1, 3],
  "scheduled-consult": [21],
  "sent-esign": [9, 2846],
  converted: [10, 1049, 2813],
  "no-viable-case": [2815, 2838, 2847],
  "reschedule-needed": [2804],
  "appointment-missed": [2842],
  missed: [2817, 2818, 2819],
};

type LawRulerListResponse<T> = {
  Count?: number;
  Data?: T[];
  IsSuccess?: boolean;
  ErrorMessage?: string | null;
};

type InboxItem = {
  LeadId?: number;
  DisplayName?: string;
  Contact?: {
    Firstname?: string;
    Lastname?: string;
    FullName?: string;
    PrimaryEmail?: string;
    CellPhone?: string;
  };
  CreateDate?: string;
  UpdateDateTime?: string;
  CaseType?: string;
  Status?: string;
};

type LeadDetail = {
  Source?: { Name?: string };
  Contact?: {
    Firstname?: string;
    Lastname?: string;
    FullName?: string;
    PrimaryEmail?: string;
    CellPhone?: string;
  };
};

type LeadDetailResponse = LeadDetail & {
  Data?: LeadDetail;
};

type ReportRow = Record<string, string>;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function getToken(): Promise<string> {
  const cached = tokenCache.get("token");
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const body = new URLSearchParams({
    grant_type: "password",
    username: requiredEnv("LAW_RULER_USERNAME"),
    password: requiredEnv("LAW_RULER_PASSWORD"),
    scope: "openid profile read write offline_access",
    client_id: requiredEnv("LAW_RULER_CLIENT_ID"),
    client_secret: requiredEnv("LAW_RULER_CLIENT_SECRET"),
  });

  const res = await fetch(requiredEnv("LAW_RULER_AUTH_URL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Law Ruler auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };

  tokenCache.set("token", {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(data.expires_in - 60, 60) * 1000,
  });

  return data.access_token;
}

export async function lawRulerGet<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(requiredEnv("LAW_RULER_BASE_URL") + path);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  let res: Response | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (res.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
  }

  if (!res?.ok) throw new Error(`Law Ruler API ${path} failed: ${res?.status}`);
  return res.json() as Promise<T>;
}

async function lawRulerPost<T>(
  path: string,
  body: unknown,
  params?: Record<string, string | number>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(requiredEnv("LAW_RULER_BASE_URL") + path);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  let res: Response | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });

    if (res.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
  }

  if (!res?.ok) throw new Error(`Law Ruler API ${path} failed: ${res?.status}`);
  return res.json() as Promise<T>;
}

async function lawRulerPostText(
  path: string,
  body: unknown,
  params?: Record<string, string | number>,
): Promise<string> {
  const token = await getToken();
  const url = new URL(requiredEnv("LAW_RULER_BASE_URL") + path);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  let res: Response | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/csv, application/octet-stream, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });

    if (res.status !== 429) break;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
  }

  if (!res?.ok) throw new Error(`Law Ruler API ${path} failed: ${res?.status}`);
  return res.text();
}

export function parseLawRulerDate(input: string): Date {
  const stripped = input.replace(/[+-]\d{2}:\d{2}$/, "").replace(/Z$/, "");
  return fromZonedTime(stripped, "America/New_York");
}

export async function withTtl<T>(key: string, ttlMs: number, load: () => Promise<T>) {
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const value = await load();
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function matchesPracticeArea(caseType: string | undefined, practiceArea: string) {
  const normalizedPracticeArea = practiceArea.toUpperCase();
  const normalizedCaseType = String(caseType ?? "").toLowerCase();

  if (normalizedPracticeArea === "DLR") return normalizedCaseType.includes("license");
  if (normalizedPracticeArea === "PI") return normalizedCaseType.includes("personal injury");
  return true;
}

function caseTypeIdsForPracticeArea(practiceArea: string) {
  return CASE_TYPE_IDS[practiceArea.toUpperCase()] ?? [];
}

function statusIdsForDashboardStatus(status: string | null | undefined) {
  if (!status || status === "all") return [];
  return STATUS_IDS[status as FunnelStatus] ?? [];
}

function parseCsv(text: string): ReportRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() ?? ""])),
  );
}

function splitName(fullName: string | undefined) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

async function getLeadDetail(leadId: string) {
  const cached = leadDetailCache.get(leadId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const detail = await lawRulerGet<LeadDetailResponse>("/ApiCases/GetLead", { leadId });
    const value = detail.Data ?? detail;
    leadDetailCache.set(leadId, { value, expiresAt: Date.now() + 5 * 60_000 });
    return value;
  } catch {
    leadDetailCache.set(leadId, { value: null, expiresAt: Date.now() + 60_000 });
    return null;
  }
}

async function loadLeadSources(leadIds: string[]) {
  const sourceByLead = new Map<string, string>();
  const uniqueIds = [...new Set(leadIds)].filter(Boolean).slice(0, SOURCE_ENRICHMENT_LIMIT);

  for (let i = 0; i < uniqueIds.length; i += 8) {
    const batch = uniqueIds.slice(i, i + 8);
    const details = await Promise.all(batch.map((id) => getLeadDetail(id)));

    details.forEach((detail, index) => {
      const source = detail?.Source?.Name?.trim();
      if (source) sourceByLead.set(batch[index], source);
    });

    if (i + 8 < uniqueIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 75));
    }
  }

  return sourceByLead;
}

export async function getLeads({
  practiceArea = "DLR",
  startDate,
  endDate,
  status,
}: {
  practiceArea?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}) {
  const cacheKey = `leads:${practiceArea}:${startDate ?? ""}:${endDate ?? ""}:${status ?? ""}`;

  return withTtl(cacheKey, 60_000, async () => {
    const pageSize = 100;
    const allItems: InboxItem[] = [];
    const normalizedPracticeArea = practiceArea.toUpperCase();
    const caseTypeIds = caseTypeIdsForPracticeArea(normalizedPracticeArea);
    const statusIds = statusIdsForDashboardStatus(status);
    const hasServerSideFilter = caseTypeIds.length > 0 || startDate || endDate || statusIds.length > 0;

    if (hasServerSideFilter) {
      const filter = {
        InboxType: 1,
        ...(caseTypeIds.length ? { CaseTypes: caseTypeIds } : {}),
        ...(statusIds.length ? { Statuses: statusIds } : {}),
        ...(startDate ? { FromDate: `${startDate}T00:00:00` } : {}),
        ...(endDate ? { ToDate: `${endDate}T23:59:59` } : {}),
        DefaultSortOrder: 1,
        DefaultSortOrderAscending: false,
      };

      let page = 1;
      let totalPages = 1;

      do {
        const result = await lawRulerPost<LawRulerListResponse<InboxItem>>(
          "/ApiCases/SearchInboxItems",
          filter,
          { page, pageSize },
        );

        allItems.push(...(result.Data ?? []));
        totalPages = Math.max(1, Math.ceil((result.Count ?? allItems.length) / pageSize));
        page += 1;

        if (page <= totalPages) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } while (page <= totalPages);
    } else {
      const pages = [1, 2, 3];

      for (const page of pages) {
        const result = await lawRulerGet<LawRulerListResponse<InboxItem>>(
          "/ApiCases/GetInboxItems",
          { inboxType: 1, page, pageSize },
        );

        allItems.push(...(result.Data ?? []));
        if ((result.Data ?? []).length < pageSize) break;
      }
    }

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const sourceIds = allItems
      .filter((item) => matchesPracticeArea(item.CaseType, practiceArea))
      .filter((item) => {
        const created = item.CreateDate ? parseLawRulerDate(item.CreateDate) : new Date();
        if (start && created < start) return false;
        if (end && created > end) return false;
        const statusKey = mapStatus(item.Status);
        return !status || status === "all" || statusKey === status;
      })
      .map((item) => String(item.LeadId ?? ""))
      .filter(Boolean);
    const sourceByLead = await loadLeadSources(sourceIds);

    return allItems
      .map((item): Lead | null => {
        const id = String(item.LeadId ?? "");
        if (!id || !matchesPracticeArea(item.CaseType, practiceArea)) return null;

        const created = item.CreateDate ? parseLawRulerDate(item.CreateDate) : new Date();
        const updated = item.UpdateDateTime ? parseLawRulerDate(item.UpdateDateTime) : created;
        if (start && created < start) return null;
        if (end && created > end) return null;

        const statusKey = mapStatus(item.Status);
        if (status && status !== "all" && statusKey !== status) return null;

        const fallback = splitName(item.DisplayName);
        const firstName = item.Contact?.Firstname || fallback.firstName;
        const lastName = item.Contact?.Lastname || fallback.lastName;
        const fullName = item.Contact?.FullName || item.DisplayName || [firstName, lastName].filter(Boolean).join(" ");

        return {
          id,
          firstName,
          lastName,
          fullName: fullName || `Lead ${id}`,
          email: item.Contact?.PrimaryEmail,
          phone: item.Contact?.CellPhone,
          caseType: item.CaseType,
          practiceArea,
          rawStatus: item.Status ?? "Unknown",
          status: statusKey,
          source: sourceByLead.get(id) ?? "Source unavailable",
          createdAt: created.toISOString(),
          updatedAt: updated.toISOString(),
          daysOpen: Math.max(0, differenceInCalendarDays(new Date(), created)),
        };
      })
      .filter((lead): lead is Lead => Boolean(lead));
  });
}

export async function getSourceReport({
  practiceArea = "DLR",
  startDate,
  endDate,
}: {
  practiceArea?: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<SourceCount[]> {
  const cacheKey = `source-report:${practiceArea}:${startDate ?? ""}:${endDate ?? ""}`;

  return withTtl(cacheKey, 60_000, async () => {
    const pageSize = 500;
    const normalizedPracticeArea = practiceArea.toUpperCase();
    const caseTypeIds = caseTypeIdsForPracticeArea(normalizedPracticeArea);
    const filter = {
      ...(startDate ? { StartDate: `${startDate}T00:00:00` } : {}),
      ...(endDate ? { EndDate: `${endDate}T23:59:59` } : {}),
      ...(caseTypeIds.length ? { CaseTypes: caseTypeIds } : {}),
    };
    const rows: ReportRow[] = [];
    let page = 1;

    while (true) {
      const csv = await lawRulerPostText("/ApiReport/GetCustomReport", filter, { page, pageSize });
      const pageRows = parseCsv(csv);
      rows.push(...pageRows);

      if (pageRows.length < pageSize) break;
      page += 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const sourceMap = new Map<string, SourceCount>();

    for (const row of rows) {
      const source = row.Source || "Source unavailable";
      const current = sourceMap.get(source) ?? { source, count: 0, converted: 0 };
      current.count += 1;
      if (mapStatus(row.Status) === "converted") current.converted += 1;
      sourceMap.set(source, current);
    }

    return [...sourceMap.values()].sort((a, b) => b.count - a.count);
  });
}
