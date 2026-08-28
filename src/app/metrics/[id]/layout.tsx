import { metrics } from "@/lib/data/catalogue";

export function generateStaticParams() {
  return metrics.map((metric) => ({ id: metric.id }));
}

export default function MetricLayout({ children }: { children: React.ReactNode }) {
  return children;
}
