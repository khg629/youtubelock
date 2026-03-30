import { NextRequest, NextResponse } from "next/server";
import { workerFetch } from "@/lib/worker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, oauth_token } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const info = await workerFetch("/info", {
      method: "POST",
      body: JSON.stringify({ url, oauth_token }),
    });

    return NextResponse.json(info);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch video info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
