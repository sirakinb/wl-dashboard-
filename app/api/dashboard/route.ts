import { NextResponse } from "next/server";
import { buildDashboardResponse } from "@/lib/dashboard-data";
import { getLeads, getSourceReport } from "@/lib/lawruler";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const practiceArea = searchParams.get("practiceArea") ?? "DLR";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const [leads, sources] = await Promise.all([
      getLeads({
        practiceArea,
        startDate,
        endDate,
        status: searchParams.get("status"),
      }),
      getSourceReport({ practiceArea, startDate, endDate }),
    ]);

    return NextResponse.json(buildDashboardResponse(leads, sources));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
