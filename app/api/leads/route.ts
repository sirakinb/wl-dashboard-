import { NextResponse } from "next/server";
import { getLeads } from "@/lib/lawruler";

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const leads = await getLeads({
      practiceArea: searchParams.get("practiceArea") ?? "DLR",
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      status: searchParams.get("status"),
    });

    return NextResponse.json(leads);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
