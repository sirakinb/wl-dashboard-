"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SourceCount } from "@/lib/types";

const COLORS = ["#1E3A8A", "#059669", "#D97706", "#7C3AED", "#DC2626", "#6B7280"];

export function SourceBreakdown({ sources }: { sources: SourceCount[] }) {
  const total = sources.reduce((sum, source) => sum + source.count, 0);
  let offset = 0;
  const gradient = sources.slice(0, 6).map((source, index) => {
    const start = offset;
    const pct = total ? (source.count / total) * 100 : 0;
    offset += pct;
    return `${COLORS[index]} ${start}% ${offset}%`;
  });

  return (
    <Card className="h-full border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">
          Source Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="flex flex-col items-center gap-6">
          <div
            className="grid size-48 place-items-center rounded-full"
            style={{ background: total ? `conic-gradient(${gradient.join(", ")})` : "#EEF1F5" }}
          >
            <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-sm">
              <div>
                <div className="font-mono text-2xl font-semibold">{total}</div>
                <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">Leads</div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3">
            {sources.slice(0, 6).map((source, index) => (
              <div key={source.source} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="truncate font-medium text-[#1F2937]">{source.source}</span>
                </div>
                <span className="font-mono text-[#6B7280]">
                  {total ? Math.round((source.count / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
