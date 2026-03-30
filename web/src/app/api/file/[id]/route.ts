import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${WORKER_URL}/file/${id}`);

    if (!res.ok) {
      return NextResponse.json({ error: "File not available" }, { status: res.status });
    }

    const headers = new Headers();
    const contentDisposition = res.headers.get("content-disposition");
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }
    headers.set("content-type", res.headers.get("content-type") || "application/octet-stream");

    return new NextResponse(res.body, { headers });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to download file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
