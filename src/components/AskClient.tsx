"use client";

import Link from "next/link";
import { useState } from "react";
import { answerQuestion } from "@/lib/engine/ask";
import type { AskAnswer } from "@/lib/types";

const suggestions = [
  "What is the official approval-rate definition?",
  "Why did Finance and Sales report different numbers?",
  "Which meeting first introduced the 47% value?",
  "What was the correct number at the time of the meeting?",
  "Which metrics create the most confusion?",
  "Are people avoiding the official dashboard? Why?",
];

export function AskClient() {
  const [question, setQuestion] = useState(suggestions[1]);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [pending, setPending] = useState(false);

  function ask(next: string) {
    setPending(true);
    setAnswer(answerQuestion(next));
    setPending(false);
  }

  return (
    <div>
      <form
        className="panel p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          className="field"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary mt-4"
        >
          {pending ? "Retrieving evidence…" : "Ask with evidence"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuestion(item);
              void ask(item);
            }}
            className="rounded-full border border-line px-3 py-1.5 text-left text-xs text-muted hover:text-cream"
          >
            {item}
          </button>
        ))}
      </div>
      {answer && (
        <article className="panel mt-8 p-6">
          <div className="text-xs uppercase tracking-[0.12em] text-muted">Answer</div>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-cream">{answer.answer}</div>
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.12em] text-muted">Evidence</div>
            <div className="mt-3 flex flex-col gap-2">
              {answer.citations.map((citation) => (
                <Link key={`${citation.kind}-${citation.id}`} href={citation.href} className="text-sm text-signal">
                  {citation.label}
                </Link>
              ))}
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
