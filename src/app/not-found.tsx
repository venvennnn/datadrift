export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-signal">Not found</p>
      <h1 className="serif mt-3 text-4xl text-cream">This record is not in the authorised workspace.</h1>
      <p className="mt-4 text-sm text-muted">
        Transcripts and findings are only visible to people who could access the original source.
      </p>
    </div>
  );
}
