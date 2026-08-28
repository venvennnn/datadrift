"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Inbox,
  MessagesSquare,
  BookOpen,
  Map,
  MessageCircleQuestion,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Overview", icon: Compass },
  { href: "/inbox", label: "Alignment Inbox", icon: Inbox },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/metrics", label: "Metric Catalogue", icon: BookOpen },
  { href: "/drift-map", label: "Drift Map", icon: Map },
  { href: "/ask", label: "Ask the Detector", icon: MessageCircleQuestion },
  { href: "/slack", label: "Slack verification", icon: Hash },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-ink-2/90 px-5 py-6 lg:flex lg:flex-col">
        <Link href="/" className="block">
          <div className="text-[11px] tracking-[0.22em] uppercase text-signal">
            Alignment layer
          </div>
          <div className="serif mt-2 text-2xl leading-none text-cream">
            Data Drift Detector
          </div>
          <p className="mt-3 text-sm leading-5 text-muted">
            Catch metric misalignment before it becomes a business decision.
          </p>
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-signal/10 text-cream"
                    : "text-muted hover:bg-white/5 hover:text-cream",
                )}
              >
                <Icon size={16} className={active ? "text-signal" : "text-muted"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-line bg-panel p-4 text-xs leading-5 text-muted">
          <div className="mb-2 flex items-center gap-2 text-signal">
            <ShieldCheck size={14} />
            Designed not to police people
          </div>
          Authorised sources only. Findings describe alignment issues, not individual accuracy. No employee scores.
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-ink/80 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">
              Processing authorised meetings and Slack channels only. Transcript excerpts are shown solely to explain a finding.
            </p>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-signal">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              Read-only trusted data
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
