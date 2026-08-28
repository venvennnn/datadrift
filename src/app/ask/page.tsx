import { AskClient } from "@/components/AskClient";

export default function AskPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-signal">Evidence-backed Q&A</p>
      <h1 className="serif mt-3 text-4xl text-cream">Ask the Detector</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Responses include calculation context and source links. The detector will not invent an authoritative number or generate unrestricted SQL.
      </p>
      <div className="mt-8">
        <AskClient />
      </div>
    </div>
  );
}
