import { NextResponse } from "next/server";
import { buildSources } from "@/lib/dashboard-data";
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

    return NextResponse.json(buildSources(leads));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sources";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
