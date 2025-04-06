import { ChatRoom } from "@/components/ChatRoom";

export default function Home() {
  return (
    <div className="h-[100vh] flex">
      <div className="h-full w-full">Canvas Here</div>
      <ChatRoom />
    </div>
  );
}
