// app/(main)/messages/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, MessageCircle, UserPlus, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  chat: string;
  createdAt: string;
  read: boolean;
}

interface Chat {
  _id: string;
  participants: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    online?: boolean;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  name?: string;
}

interface ChatViewProps {
  chatId: string;
  onBack: () => void;
}

function ChatView({ chatId, onBack }: ChatViewProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Chat</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                "max-w-[70%] rounded-lg p-3",
                msg.sender._id === session?.user?.id
                  ? "ml-auto bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="mt-1 text-[10px] opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  interface User {
    _id: string;
    name: string;
    username: string;
    image?: string;
  }

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/messages/chats");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch chats");
      }
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user) {
      fetchChats();
    }
  }, [session, status, router, fetchChats]);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      setSelectedChat(chatId);
    }
  }, [searchParams]);

  const handleSearchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to search users");
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCreateChat = async (userId: string) => {
    try {
      const res = await fetch("/api/messages/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: [userId] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create chat");
      }
      const data = await res.json();
      setChats((prev) => [data.chat, ...prev]);
      setSelectedChat(data.chat._id);
      setIsNewChatOpen(false);
      toast.success("Chat created!");
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create chat");
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    if (chat.isGroup && chat.name) {
      return chat.name.toLowerCase().includes(searchLower);
    }
    const otherUser = chat.participants.find((p) => p._id !== session?.user?.id);
    return (
      otherUser?.name.toLowerCase().includes(searchLower) ||
      otherUser?.username.toLowerCase().includes(searchLower)
    );
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[800px] overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Chat List Sidebar */}
      <div className="flex w-full flex-col overflow-y-auto border-r pr-2 md:w-1/3">
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search for a user..."
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleCreateChat(user._id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image} />
                              <AvatarFallback>
                                {user.name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Chat List */}
        <div className="space-y-2 overflow-y-auto p-2">
          {filteredChats.length === 0 ? (
            <div className="py-4 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No conversations</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = chat.participants.find((p) => p._id !== session?.user?.id);
              const displayName = chat.isGroup ? chat.name : otherUser?.name;
              const displayImage = chat.isGroup ? undefined : otherUser?.image;
              const isOnline = chat.isGroup ? false : otherUser?.online;

              return (
                <div
                  key={chat._id}
                  className={cn(
                    "cursor-pointer items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                    selectedChat === chat._id && "bg-gray-100 dark:bg-gray-700"
                  )}
                  onClick={() => setSelectedChat(chat._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={displayImage} />
                        <AvatarFallback>{displayName?.[0]?.toUpperCase() || "C"}</AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{displayName || "Unknown"}</p>
                      {chat.lastMessage && (
                        <p className="truncate text-xs text-gray-500">{chat.lastMessage.content}</p>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <Badge className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className="hidden flex-1 flex-col md:flex">
        {selectedChat ? (
          <ChatView chatId={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
              <p className="text-xl font-medium text-muted-foreground">No conversation selected</p>
              <p className="text-sm text-muted-foreground">
                Select a chat from the sidebar or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
