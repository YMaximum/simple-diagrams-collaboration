import Canvas from "@/components/Canvas";
import ChatRoom from "@/components/ChatRoom";
import { UserContextProvier } from "@/components/context/UserContext";
import LeftSidebar from "@/components/LeftSidebar";

export default function Home() {
  return (
    <div className="h-[100vh] flex">
      <UserContextProvier>
        <LeftSidebar />
        <Canvas />
        <ChatRoom />
      </UserContextProvier>
    </div>
  );
}
