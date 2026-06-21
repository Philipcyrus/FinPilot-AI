import { PageHeader } from "@/components/common";
import { ChatClient } from "@/components/chat/ChatClient";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="AI Co-pilot" subtitle="Your personal CFO — ask anything about your financial life." icon={<MessageSquare className="h-5 w-5" />} />
      <ChatClient />
    </div>
  );
}
