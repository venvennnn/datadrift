"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FindingStatus } from "@/lib/types";

const options: FindingStatus[] = [
  "confirmed_drift",
  "valid_alternative_context",
  "database_issue",
  "definition_issue",
  "documentation_issue",
  "false_positive",
  "needs_investigation",
  "resolved",
];

export function ResolveForm({ findingId }: { findingId: string }) {
  const router = useRouter();
  const [resolutionType, setResolutionType] = useState<FindingStatus>("confirmed_drift");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/findings/${findingId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolutionType, comment, reviewerId: "noura" }),
    });
    if (!response.ok) {
      setError("Could not record the resolution.");
      setPending(false);
      return;
    }
    setComment("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-xs uppercase tracking-[0.12em] text-muted">
        Human resolution
        <select
          value={resolutionType}
          onChange={(event) => setResolutionType(event.target.value as FindingStatus)}
          className="field mt-2 normal-case tracking-normal"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs uppercase tracking-[0.12em] text-muted">
        Evidence and comment
        <textarea
          required
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Explain why this is drift, a valid alternative, or a trusted-source issue."
          className="field mt-2 normal-case tracking-normal"
        />
      </label>
      {error && <p className="text-sm text-alert">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary"
      >
        {pending ? "Recording…" : "Record resolution"}
      </button>
    </form>
  );
}
