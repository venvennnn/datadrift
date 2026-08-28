import { NextResponse } from "next/server";
import { verifySlackQuestion } from "@/lib/engine/slack";

export async function POST(request: Request) {
  const body = (await request.json()) as { question?: string; thread?: string };
  if (!body.question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  return NextResponse.json(verifySlackQuestion(body.question, body.thread ?? ""));
}
