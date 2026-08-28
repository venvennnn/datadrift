"use client";

import { useState } from "react";
import type { SlackReply } from "@/lib/types";

const thread = `Priya Shah: Malaysia's approval rate is 42% based on the weekly tracker. Can we use that in the partner review?
Daniel Okonkwo: That does not match the risk pack.`;

export function SlackClient() {
  const [question, setQuestion] = useState(
    "@DataDrift Is the 42% approval rate mentioned above correct for Malaysia in July?",
  );
  const [reply, setReply] = useState<SlackReply | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const response = await fetch("/api/slack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, thread }),
    });
    setReply((await response.json()) as SlackReply);
    setPending(false);
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line bg-panel-2 px-5 py-3 text-sm text-cream">#credit-ops · authorised channel</div>
      <div className="space-y-4 p-5">
        {thread.split("\n").map((line) => (
          <div key={line} className="rounded-2xl bg-ink-2 p-4 text-sm leading-6 text-cream">
            {line}
          </div>
        ))}
        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-ink-2 px-4 py-3 text-sm text-cream"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
          >
            {pending ? "Verifying…" : "Invoke @DataDrift"}
          </button>
        </form>
        {reply && (
          <div className="rounded-2xl border border-signal/30 bg-signal/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-signal">DataDrift · in-thread, not a public correction</div>
            <p className="mt-3 text-sm leading-6 text-cream">{reply.reply}</p>
          </div>
        )}
      </div>
    </div>
  );
}
