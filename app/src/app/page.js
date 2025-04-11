import Canvas from "@/components/Canvas";
import ChatRoom from "@/components/ChatRoom";
import LeftSidebar from "@/components/LeftSidebar";

export default function Home() {
  return (
    <div className="h-[100vh] flex">
      <LeftSidebar />
      <Canvas />
      <ChatRoom />
    </div>
  );
}
