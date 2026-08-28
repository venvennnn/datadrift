import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.12em] text-signal">MVP ingestion</p>
      <h1 className="serif mt-3 text-4xl text-cream">Upload a transcript</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Starting with uploads lets the core detection and governance workflow be validated before Google Workspace permissions. Audio is not transcribed in this demo. Use speaker lines such as <span className="text-cream">Priya Shah (Sales): July approval rate was 47%.</span>
      </p>
      <UploadForm />
    </div>
  );
}
