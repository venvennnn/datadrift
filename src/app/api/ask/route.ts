import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/engine/ask";

export async function POST(request: Request) {
  const body = (await request.json()) as { question?: string };
  if (!body.question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  return NextResponse.json(answerQuestion(body.question));
}
