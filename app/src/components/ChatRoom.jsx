"use client";
import { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./context/UserContext";
import { WebsocketProvider } from "y-websocket";
import { doc } from "@/data/ydoc";
import { initialNodes } from "@/data/nodes";
import { initialEdges } from "@/data/edges";

export default function ChatRoom() {
  let {
    sessionId,
    setSessionId,
    socket,
    username,
    isSessionJoined,
    setIsSessionJoined,
    setSocket,
    setUsername,
  } = useContext(UserContext);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL
        ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/chat`
        : "http://localhost:3001/chat"
    );

    newSocket.on("connect", () => {
      console.log("Connected to chat service");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("chat-messages", (chatMessages) => {
      setChatMessages(chatMessages);
    });

    newSocket.on("user-list", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    setSocket((prevSocket) => ({ ...prevSocket, chat: newSocket }));

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinSession = () => {
    if (username && socket.chat) {
      socket.chat.emit("join-session", { username, sessionId });
      socket.collab.emit("join-session", { username, sessionId });
      setIsSessionJoined(true);
    }
  };

  const handleLeaveSession = () => {
    if (username && socket.chat) {
      socket.chat.emit("leave-session", { username, sessionId });
      socket.yws.disconnect();
      setIsSessionJoined(false);
    }
  };

  const handleSendMessage = () => {
    if (username && socket.chat && message !== "") {
      socket.chat.emit("send-message", { username, message, sessionId });
      setMessage("");
    }
  };

  return (
    <div className="max-w-[25vw] min-w-[20vw] mx-auto p-4 h-full flex flex-col gap-2 border-l">
      <h1 className="text-2xl font-bold">Session</h1>

      {!isConnected && (
        <div className="p-4 rounded">
          Not connected to server. Please check your connection.
        </div>
      )}

      {!isSessionJoined ? (
        <div className="flex gap-1">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="border w-[35%] text-sm p-2 placeholder:text-xs"
          />
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter session id"
            className="border w-[35%] text-sm p-2 placeholder:text-xs"
          />
          <button
            onClick={handleJoinSession}
            className="bg-blue-500 text-white text-sm p-2 rounded cursor-pointer disabled:bg-red-600 disabled:cursor-not-allowed"
            disabled={!username || !isConnected || !sessionId}
          >
            Join Session
          </button>
        </div>
      ) : (
        <div className="flex justify-between">
          <div>
            <p>
              <b>Username :</b> {username}
            </p>
            <p>
              <b>Sesion Id :</b> {sessionId}
            </p>
          </div>
          <button
            onClick={handleLeaveSession}
            className="bg-red-600 text-white text-sm p-2 rounded cursor-pointer"
          >
            Leave Session
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Active Users</h2>
        <ul className="border p-2 w-full max-h-[100px]">
          {users.map((user, index) => (
            <li key={index} className="mb-1">
              {user}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col flex-1 gap-2">
        <h2 className="text-lg font-bold">Chat Room</h2>
        <div className="flex-1 max-h-[65vh] border flex flex-col gap-2 overflow-y-auto p-2">
          {chatMessages.map((item, index) => (
            <div
              key={index}
              className={`p-2 rounded-sm w-fit ${
                item.username === username
                  ? "self-end bg-green-200"
                  : "bg-gray-200 "
              }`}
            >
              <p className="font-bold">
                {item.username === username ? "You" : item.username}
              </p>
              <div className="flex gap-2 items-center">
                <p className="">{item.message} </p>
                <p className="text-xs text-gray-800">
                  {new Date(item.timestamp * 1000).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full border p-2 text-sm"
            placeholder="Start typing here..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-black text-white text-sm p-2 rounded cursor-pointer"
            disabled={!username || !isConnected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
