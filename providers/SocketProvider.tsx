"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSocket } from "@/hooks/useSocket";

// Create the context
const SocketContext = createContext<ReturnType<typeof useSocket> | null>(null);

// Provider component
export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Custom hook to use the socket context
export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
