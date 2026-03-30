import { NextRequest, NextResponse } from "next/server";
import { workerFetch } from "@/lib/worker";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const status = await workerFetch(`/status/${id}`);
    return NextResponse.json(status);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to get status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
