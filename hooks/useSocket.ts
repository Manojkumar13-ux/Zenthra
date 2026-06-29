import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  sendMessage: (data: any) => boolean;
  joinRoom: (room: string) => boolean;
  leaveRoom: (room: string) => boolean;
  sendTyping: (data: any) => boolean;
  markAsRead: (data: any) => boolean;
}

export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!session?.user?.id) {
      console.log("🔌 No session, skipping socket connection");
      return;
    }

    // Create socket connection
    const socket = io({
      path: "/socket.io/",
      query: { userId: session.user.id },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);
    });

    // Online users
    socket.on("online-users", (users: string[]) => {
      console.log("👥 Online users:", users);
      setOnlineUsers(users);
    });

    // Receive message
    socket.on("receive-message", (message) => {
      console.log("📩 Received message:", message);
      // You can add notification logic here
    });

    // Typing indicator
    socket.on("typing-indicator", (data) => {
      console.log("⌨️ Typing:", data);
    });

    // Read receipt
    socket.on("read-receipt", (data) => {
      console.log("✅ Read receipt:", data);
    });

    // Message sent confirmation
    socket.on("message-sent", (message) => {
      console.log("✅ Message sent:", message);
    });

    // Cleanup
    return () => {
      console.log("🔌 Cleaning up socket connection");
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("online-users");
        socket.off("receive-message");
        socket.off("typing-indicator");
        socket.off("read-receipt");
        socket.off("message-sent");
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [session?.user?.id]);

  // Functions to emit events
  const sendMessage = (data: any): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send-message", data);
      return true;
    }
    console.warn("Socket not connected, message not sent");
    return false;
  };

  const joinRoom = (room: string): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join-room", room);
      return true;
    }
    return false;
  };

  const leaveRoom = (room: string): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave-room", room);
      return true;
    }
    return false;
  };

  const sendTyping = (data: any): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", data);
      return true;
    }
    return false;
  };

  const markAsRead = (data: any): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("mark-read", data);
      return true;
    }
    return false;
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendTyping,
    markAsRead,
  };
}
