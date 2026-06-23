import { ChatWindow } from '@/features/chat';

// Ambient orbs positioned for chat page
function AmbientGlow() {
  return (
    <>
      <div className="ambient-orb fixed top-1/4 right-1/4 w-[600px] h-[600px] opacity-[0.06]" />
      <div className="ambient-orb fixed bottom-1/3 left-1/3 w-[500px] h-[500px] opacity-[0.04]" />
    </>
  );
}

export default function ChatPage() {
  return (
    <>
      <AmbientGlow />
      <ChatWindow />
    </>
  );
}
