import { NextResponse } from "next/server";
import { buildFunnel } from "@/lib/dashboard-data";
import { getLeads } from "@/lib/lawruler";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const leads = await getLeads({
      practiceArea: searchParams.get("practiceArea") ?? "DLR",
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    return NextResponse.json(buildFunnel(leads));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load funnel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
