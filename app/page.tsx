"use client";

import { subDays, format } from "date-fns";
import useSWR from "swr";
import { DashboardHeader, type DatePreset, type PracticeArea } from "@/components/Header";
import { FunnelChart } from "@/components/FunnelChart";
import { KPICards } from "@/components/KPICards";
import { LeadTable } from "@/components/LeadTable";
import { SourceBreakdown } from "@/components/SourceBreakdown";
import { fetcher } from "@/lib/fetcher";
import type { DashboardResponse, FunnelStatus } from "@/lib/types";
import { useMemo, useState } from "react";

function dateParams(preset: DatePreset) {
  if (preset === "all") return "";
  const end = new Date();
  const start = subDays(end, Number(preset));
  return `&startDate=${format(start, "yyyy-MM-dd")}&endDate=${format(end, "yyyy-MM-dd")}`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
        <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
    </div>
  );
}

export default function Dashboard() {
  const [preset, setPreset] = useState<DatePreset>("30");
  const [practiceArea, setPracticeArea] = useState<PracticeArea>("DLR");
  const [statusFilter, setStatusFilter] = useState<"all" | FunnelStatus>("all");
  const query = useMemo(
    () => `/api/dashboard?practiceArea=${practiceArea}${dateParams(preset)}`,
    [practiceArea, preset],
  );
  const { data, error, isLoading } = useSWR<DashboardResponse>(query, fetcher, {
    keepPreviousData: true,
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <DashboardHeader
        preset={preset}
        onPresetChange={setPreset}
        practiceArea={practiceArea}
        onPracticeAreaChange={setPracticeArea}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:px-8">
        {isLoading && !data && <DashboardSkeleton />}

        {error && (
          <div className="rounded-xl border border-red-200 bg-white p-6 text-red-700 shadow-sm">
            <p className="font-semibold">Unable to load Law Ruler data.</p>
            <p className="mt-1 text-sm">{error.message}</p>
          </div>
        )}

        {data && (
          <>
            <KPICards funnel={data.funnel} practiceArea={practiceArea} />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <FunnelChart buckets={data.funnel.buckets} />
              <SourceBreakdown sources={data.sources} />
            </section>

            <LeadTable leads={data.leads} filter={statusFilter} onFilterChange={setStatusFilter} />
          </>
        )}
      </div>

      <footer className="mt-10 bg-[#1A2B4A] px-6 py-8 text-center">
        <p className="font-serif text-lg text-white">White Law PLLC</p>
        <p className="mt-2 text-sm text-[#A8C4E8]">
          Okemos, MI 48864 · 517-316-1195 · whitelawpllc.com
        </p>
      </footer>
    </main>
  );
}
