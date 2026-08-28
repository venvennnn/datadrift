import { SlackClient } from "@/components/SlackClient";

export default function SlackPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-signal">On-demand Slack</p>
      <h1 className="serif mt-3 text-4xl text-cream">Verify a number without correcting a person</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The bot analyses only authorised channels, understands threads, and never posts an automatic public correction. High-impact findings still need a human owner.
      </p>
      <div className="mt-8">
        <SlackClient />
      </div>
    </div>
  );
}
