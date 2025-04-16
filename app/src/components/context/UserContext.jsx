"use client";
import { createContext, useContext, useState } from "react";

export const UserContext = createContext();

export function UserContextProvier({ children }) {
  const [sessionId, setSessionId] = useState("");
  const [isSessionJoined, setIsSessionJoined] = useState(false);
  const [socket, setSocket] = useState({});
  const [username, setUsername] = useState("");

  return (
    <UserContext.Provider
      value={{
        sessionId,
        isSessionJoined,
        socket,
        username,
        setSessionId,
        setIsSessionJoined,
        setSocket,
        setUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
