"use client";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export default function ChatRoom() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isSessionJoined, setIsSessionJoined] = useState(false);

  useEffect(() => {
    const newSocket = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001"
    );

    newSocket.on("connect", () => {
      console.log("Connected to server");
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

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinSession = () => {
    if (username && socket) {
      socket.emit("join-session", { username, sessionId });
      setIsSessionJoined(true);
    }
  };

  const handleLeaveSession = () => {
    if (username && socket) {
      socket.emit("leave-session", { username, sessionId });
      setIsSessionJoined(false);
    }
  };

  const handleSendMessage = () => {
    if (username && socket && message !== "") {
      socket.emit("send-message", { username, message, sessionId });
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
