"use client";

import { CalendarDays, Scale } from "lucide-react";
import { LiveBadge } from "./LiveBadge";

export type DatePreset = "7" | "30" | "90" | "all";
export type PracticeArea = "DLR" | "PI";

const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  DLR: "DLR",
  PI: "Personal Injury",
};

export function DashboardHeader({
  preset,
  onPresetChange,
  practiceArea,
  onPracticeAreaChange,
}: {
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  practiceArea: PracticeArea;
  onPracticeAreaChange: (practiceArea: PracticeArea) => void;
}) {
  return (
    <header className="bg-[#1A2B4A] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <Scale className="size-6 text-[#A8C4E8]" aria-hidden />
              <div>
                <h1 className="font-serif text-2xl leading-none">White Law PLLC</h1>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[3px] text-[#A8C4E8]">
                  Trusted Trial Attorneys
                </p>
              </div>
            </div>
            <div className="mt-5 h-px w-64 bg-[#A8C4E8]" />
            <p className="mt-4 font-serif text-2xl">Lead Pipeline</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-full border border-[#A8C4E8]/50 bg-white/10 px-4 py-2 text-sm">
              <select
                className="bg-transparent font-semibold text-white outline-none"
                value={practiceArea}
                onChange={(event) => onPracticeAreaChange(event.target.value as PracticeArea)}
                aria-label="Practice area"
              >
                {Object.entries(PRACTICE_AREA_LABELS).map(([value, label]) => (
                  <option key={value} className="text-slate-900" value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 rounded-full border border-[#A8C4E8]/50 bg-white/10 px-4 py-2 text-sm">
              <CalendarDays className="size-4 text-[#A8C4E8]" aria-hidden />
              <select
                className="bg-transparent font-medium text-white outline-none"
                value={preset}
                onChange={(event) => onPresetChange(event.target.value as DatePreset)}
                aria-label="Date range"
              >
                <option className="text-slate-900" value="7">
                  Last 7 Days
                </option>
                <option className="text-slate-900" value="30">
                  Last 30 Days
                </option>
                <option className="text-slate-900" value="90">
                  Last 90 Days
                </option>
                <option className="text-slate-900" value="all">
                  All Visible Leads
                </option>
              </select>
            </label>
            <LiveBadge />
          </div>
        </div>
      </div>
    </header>
  );
}
