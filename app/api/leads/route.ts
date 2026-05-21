import { NextResponse } from "next/server";
import { applySourceAttribution, getLeads, getSourceAttributionReport } from "@/lib/lawruler";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const practiceArea = searchParams.get("practiceArea") ?? "DLR";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const [leads, sourceReport] = await Promise.all([
      getLeads({
        practiceArea,
        startDate,
        endDate,
        status: searchParams.get("status"),
      }),
      getSourceAttributionReport({ practiceArea, startDate, endDate }),
    ]);

    return NextResponse.json(applySourceAttribution(leads, sourceReport.rows));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
