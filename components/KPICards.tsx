"use client";

import { ArrowDownRight, ArrowUpRight, Clock, FileCheck2, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FunnelData } from "@/lib/types";
import { CountUp } from "./CountUp";
import type { PracticeArea } from "./Header";

const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  DLR: "DLR",
  PI: "Personal Injury",
};

export function KPICards({
  funnel,
  practiceArea,
}: {
  funnel: FunnelData;
  practiceArea: PracticeArea;
}) {
  const cards = [
    {
      label: "Total Leads",
      value: funnel.totalLeads,
      suffix: "",
      icon: Users,
      helper: `${PRACTICE_AREA_LABELS[practiceArea]} leads in range`,
      delta: "Live count",
      positive: true,
    },
    {
      label: "Conv. Rate",
      value: funnel.conversionRate,
      suffix: "%",
      icon: Target,
      helper: "Converted leads over total",
      delta: "Current mix",
      positive: funnel.conversionRate > 0,
    },
    {
      label: "Avg Days",
      value: funnel.avgDaysToConvert ?? 0,
      suffix: "d",
      icon: Clock,
      helper: funnel.avgDaysToConvert === null ? "No converted leads in range" : "Open days for converted leads",
      delta: funnel.avgDaysToConvert === null ? "Pending" : "Measured",
      positive: funnel.avgDaysToConvert !== null,
    },
    {
      label: "Top Source",
      text: funnel.topSource ?? "Unknown",
      icon: FileCheck2,
      helper: "Most common attribution",
      delta: "From Law Ruler",
      positive: true,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="border-[#E5E7EB] bg-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">
                  {card.label}
                </p>
                <div className="mt-3 font-mono text-3xl font-semibold tracking-normal text-[#1F2937]">
                  {"text" in card ? card.text : <CountUp value={card.value} suffix={card.suffix} decimals={card.suffix === "%" ? 1 : 0} />}
                </div>
              </div>
              <div className="rounded-lg bg-[#EEF4FB] p-3 text-[#1E3A8A]">
                <card.icon className="size-5" aria-hidden />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#6B7280]">{card.helper}</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${card.positive ? "text-emerald-700" : "text-amber-700"}`}>
                {card.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {card.delta}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
