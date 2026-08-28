import { NextResponse } from "next/server";
import { resolveFinding } from "@/lib/store";
import type { FindingStatus } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    resolutionType?: FindingStatus;
    comment?: string;
    reviewerId?: string;
  };
  if (!body.resolutionType || !body.comment?.trim()) {
    return NextResponse.json({ error: "Resolution type and comment are required" }, { status: 400 });
  }
  try {
    const resolution = resolveFinding({
      findingId: id,
      resolutionType: body.resolutionType,
      comment: body.comment,
      reviewerId: body.reviewerId,
    });
    return NextResponse.json(resolution);
  } catch {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }
}
