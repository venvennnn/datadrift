import { NextResponse } from "next/server";
import { processUploadedTranscript } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; transcript?: string };
  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
  }
  const conversation = processUploadedTranscript({
    title: body.title ?? "Uploaded transcript",
    transcript: body.transcript,
  });
  return NextResponse.json({ id: conversation.id });
}
