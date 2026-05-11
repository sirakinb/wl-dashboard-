import "server-only";

import { differenceInCalendarDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { mapStatus } from "./status-mapping";
import type { Lead } from "./types";

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

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

function isDlr(caseType: string | undefined, practiceArea: string) {
  if (practiceArea.toUpperCase() !== "DLR") return true;
  return String(caseType ?? "").toLowerCase().includes("license");
}

function splitName(fullName: string | undefined) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

async function getLeadDetail(leadId: string) {
  try {
    const detail = await lawRulerGet<LeadDetailResponse>("/ApiCases/GetLead", { leadId });
    return detail.Data ?? detail;
  } catch {
    return null;
  }
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
    const pages = [1, 2];
    const pageSize = 100;
    const allItems: InboxItem[] = [];

    for (const page of pages) {
      const result = await lawRulerGet<LawRulerListResponse<InboxItem>>(
        "/ApiCases/GetInboxItems",
        { inboxType: 1, page, pageSize },
      );

      allItems.push(...(result.Data ?? []));
      if ((result.Data ?? []).length < pageSize) break;
    }

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const sourceByLead = new Map<string, string>();
    const detailIds = allItems
      .filter((item) => isDlr(item.CaseType, practiceArea))
      .slice(0, 25)
      .map((item) => String(item.LeadId ?? ""))
      .filter(Boolean);

    for (let i = 0; i < detailIds.length; i += 3) {
      const batch = detailIds.slice(i, i + 3);
      const details = await Promise.all(batch.map((id) => getLeadDetail(id)));
      details.forEach((detail, index) => {
        const source = detail?.Source?.Name?.trim();
        if (source) sourceByLead.set(batch[index], source);
      });
    }

    return allItems
      .map((item): Lead | null => {
        const id = String(item.LeadId ?? "");
        if (!id || !isDlr(item.CaseType, practiceArea)) return null;

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
          source: sourceByLead.get(id) ?? "Unknown",
          createdAt: created.toISOString(),
          updatedAt: updated.toISOString(),
          daysOpen: Math.max(0, differenceInCalendarDays(new Date(), created)),
        };
      })
      .filter((lead): lead is Lead => Boolean(lead));
  });
}
