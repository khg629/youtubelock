import { NextRequest, NextResponse } from "next/server";
import { workerFetch } from "@/lib/worker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, format_id, oauth_token } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await workerFetch("/download", {
      method: "POST",
      body: JSON.stringify({ url, format_id, oauth_token }),
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to start download";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
