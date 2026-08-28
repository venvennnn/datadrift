import { getSnapshot } from "@/lib/store";

export function generateStaticParams() {
  return getSnapshot().findings.map((finding) => ({ id: finding.id }));
}

export default function FindingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
