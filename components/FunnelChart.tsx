"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelBucket } from "@/lib/types";

function BarRow({
  bucket,
  max,
}: {
  bucket: FunnelBucket;
  max: number;
}) {
  const width = max ? Math.max(5, (bucket.count / max) * 100) : 0;

  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: bucket.color }} />
          <span className="text-sm font-semibold text-[#1F2937]">{bucket.label}</span>
        </div>
        <span className="font-mono text-sm font-semibold text-[#1F2937]">{bucket.count.toLocaleString()}</span>
      </div>
      <div className="h-9 overflow-hidden rounded-lg bg-[#EEF1F5]">
        <div
          className="h-full rounded-lg transition-all duration-300 group-hover:shadow-[inset_0_0_16px_rgba(255,255,255,0.35)]"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${bucket.color}, ${bucket.color}dd)`,
          }}
        />
      </div>
    </div>
  );
}

export function FunnelChart({ buckets }: { buckets: FunnelBucket[] }) {
  const main = buckets.filter((bucket) => bucket.isMainFlow);
  const branches = buckets.filter((bucket) => !bucket.isMainFlow);
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="space-y-4">
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">
            Main Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6 pt-2">
          {main.map((bucket) => (
            <BarRow key={bucket.status} bucket={bucket} max={max} />
          ))}
        </CardContent>
      </Card>

      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">
            Branches / Drop-Offs
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-2 sm:grid-cols-2">
          {branches.map((bucket) => (
            <div key={bucket.status} className="rounded-lg border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#1F2937]">{bucket.label}</span>
                <span className="font-mono text-lg font-semibold" style={{ color: bucket.color }}>
                  {bucket.count}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#EEF1F5]">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${max ? Math.max(3, (bucket.count / max) * 100) : 0}%`, backgroundColor: bucket.color }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
