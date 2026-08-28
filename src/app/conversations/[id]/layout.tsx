import { conversationSeeds } from "@/lib/data/transcripts";

export function generateStaticParams() {
  return [
    { id: "latest" },
    ...conversationSeeds.map((conversation) => ({ id: conversation.id })),
  ];
}

export default function ConversationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
