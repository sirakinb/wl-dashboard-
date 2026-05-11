"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status-mapping";
import type { FunnelStatus, Lead } from "@/lib/types";

const FILTERS: Array<{ value: "all" | FunnelStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "new-lead", label: "New" },
  { value: "sent-esign", label: "Sent" },
  { value: "signed-esign", label: "Signed" },
  { value: "no-viable-case", label: "No Viable" },
  { value: "reschedule-needed", label: "Reschedule" },
  { value: "appointment-missed", label: "Appt Missed" },
  { value: "missed", label: "Lost" },
];

function statusStyle(status: FunnelStatus | null) {
  const color = status ? STATUS_COLORS[status] : "#6B7280";
  return {
    color,
    backgroundColor: `${color}18`,
    borderColor: `${color}30`,
  };
}

function displayStatus(lead: Lead) {
  const cleaned = lead.rawStatus.replace(/\*+/g, "").trim();
  return cleaned || (lead.status ? STATUS_LABELS[lead.status] : "Unknown");
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<"all" | FunnelStatus>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const rows = filter === "all" ? leads : leads.filter((lead) => lead.status === filter);
    return [...rows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [filter, leads]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function changeFilter(value: "all" | FunnelStatus) {
    setFilter(value);
    setPage(1);
  }

  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#6B7280]">Lead List</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{filtered.length.toLocaleString()} leads in current view</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button
              key={item.value}
              size="sm"
              variant={filter === item.value ? "default" : "outline"}
              className={filter === item.value ? "bg-[#1E3A8A] text-white hover:bg-[#1A2B4A]" : "border-[#E5E7EB]"}
              onClick={() => changeFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8FAFC]">
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer transition-colors hover:bg-[#F8FAFC]">
                <TableCell>
                  <div className="font-medium text-[#1F2937]">{lead.fullName}</div>
                  <div className="text-xs text-[#6B7280]">{lead.caseType}</div>
                </TableCell>
                <TableCell className="text-[#6B7280]">{lead.source}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[1px]"
                    style={statusStyle(lead.status)}
                    title={lead.rawStatus}
                  >
                    {displayStatus(lead)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{lead.daysOpen}</TableCell>
                <TableCell>
                  <div className="text-sm text-[#1F2937]">
                    {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-[#6B7280]">{format(new Date(lead.updatedAt), "MMM d, yyyy h:mm a")}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
