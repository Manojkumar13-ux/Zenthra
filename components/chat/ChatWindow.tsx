"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ChatWindowProps {
  chatId: string;
  receiverId: string;
  receiverName: string;
  receiverImage?: string;
}

export function ChatWindow({ chatId, receiverId, receiverName, receiverImage }: ChatWindowProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, addMessage, setTypingStatus } = useChatStore();
  const { sendMessage, sendTyping, markAsRead, isConnected } = useSocket();

  const chatMessages = messages[chatId] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Mark messages as read when chat is active
  useEffect(() => {
    if (chatId && isConnected) {
      const unreadMessages = chatMessages.filter(
        (msg) => !msg.read && msg.senderId !== session?.user?.id
      );

      unreadMessages.forEach((msg) => {
        markAsRead({
          chatId,
          messageId: msg._id,
          userId: session?.user?.id || "",
        });
      });
    }
  }, [chatId, chatMessages, isConnected, markAsRead, session?.user?.id]);

  const handleSendMessage = async () => {
    if (!message.trim() || !session?.user) return;

    setLoading(true);
    try {
      const messageData = {
        _id: Date.now().toString(),
        content: message.trim(),
        senderId: session.user.id,
        receiverId: receiverId,
        chatId: chatId,
        read: false,
        readBy: [],
        createdAt: new Date().toISOString(),
        status: "sending" as const,
      };

      // Optimistically add message
      addMessage(chatId, messageData);

      // Send via socket
      const sent = sendMessage({
        chatId,
        message: messageData,
        senderId: session.user.id,
        receiverId,
      });

      if (!sent) {
        // Fallback to API
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            chatId,
            content: message.trim(),
            receiverId,
          }),
        });

        if (!res.ok) throw new Error("Failed to send message");
        const data = await res.json();
        // Replace optimistic message with actual one
        // Implementation depends on your API response
      }

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTyping({ chatId, receiverId, isTyping: false });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      sendTyping({ chatId, receiverId, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping({ chatId, receiverId, isTyping: false });
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg bg-white shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4 dark:border-gray-700">
        <Avatar className="h-10 w-10">
          <AvatarImage src={receiverImage} />
          <AvatarFallback>{receiverName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{receiverName}</p>
          <p className="text-xs text-muted-foreground">{isConnected ? "Online" : "Offline"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm">Say hello to {receiverName}!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${
                msg.senderId === session?.user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.senderId === session?.user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="break-words text-sm">{msg.content}</p>
                <p className="mt-1 text-xs opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {/* This would need a separate component to show typing status */}

      {/* Input */}
      <div className="border-t p-4 dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            disabled={loading || !isConnected}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !message.trim() || !isConnected}
            size="icon"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {!isConnected && (
          <p className="mt-1 text-xs text-red-500">Connecting to server... Please wait.</p>
        )}
      </div>
    </div>
  );
}
