"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const demo = `[2026-08-05 09:01] Priya Shah (Sales): July approval rate was 47%. That's why we are comfortable raising the Malaysia target this quarter.

[2026-08-05 09:02] Daniel Okonkwo (Risk): No, it was 39%. We define approval rate as approved applications divided by submitted applications.

[2026-08-05 09:03] Mei Chen (Finance): The dashboard showed 42% when I pulled it this morning. I used the Credit Ops dashboard.`;

export function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Uploaded business review");
  const [transcript, setTranscript] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/transcripts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, transcript }),
    });
    if (!response.ok) {
      setError("Upload failed. Add at least one speaker turn with a metric claim.");
      setPending(false);
      return;
    }
    const payload = (await response.json()) as { id: string };
    router.push(`/conversations/${payload.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
      <label className="block text-xs uppercase tracking-[0.16em] text-muted">
        Meeting title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-ink-2 px-4 py-3 text-sm normal-case tracking-normal text-cream"
        />
      </label>
      <label className="block text-xs uppercase tracking-[0.16em] text-muted">
        Transcript
        <textarea
          required
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={16}
          placeholder="Speaker: July approval rate was 47%."
          className="mt-2 w-full rounded-2xl border border-line bg-ink-2 px-4 py-3 font-mono text-sm normal-case tracking-normal text-cream outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setTitle("Monthly Business Review excerpt");
            setTranscript(demo);
          }}
          className="rounded-full border border-line px-4 py-2 text-sm text-cream"
        >
          Load demo excerpt
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-ink disabled:opacity-60"
        >
          {pending ? "Analysing…" : "Analyse transcript"}
        </button>
      </div>
      {error && <p className="text-sm text-alert">{error}</p>}
    </form>
  );
}
