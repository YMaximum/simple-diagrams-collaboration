"use client";
import { createContext, useContext, useState } from "react";
import { Doc } from "yjs";

export const UserContext = createContext();

export function UserContextProvier({ children }) {
  const [roomId, setRoomId] = useState("");
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [socket, setSocket] = useState({});
  const [username, setUsername] = useState("");

  return (
    <UserContext.Provider
      value={{
        roomId,
        isRoomJoined,
        socket,
        username,
        setRoomId,
        setIsRoomJoined,
        setSocket,
        setUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
