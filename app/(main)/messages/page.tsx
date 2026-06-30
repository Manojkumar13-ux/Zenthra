// app/(main)/messages/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Send,
  Loader2,
  User,
  Users,
  Image,
  Smile,
  Paperclip,
  MoreHorizontal,
  Phone,
  Video,
  Info,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Chat {
  _id: string;
  name?: string;
  isGroup: boolean;
  participants: {
    id: string;
    name: string;
    username: string;
    image?: string;
    online?: boolean;
  }[];
  lastMessage?: {
    content: string;
    sender: {
      name: string;
    };
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  _id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    username: string;
    image?: string;
  };
  chatId: string;
  createdAt: string;
  read: boolean;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchChats();
    }
  }, [status]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/messages/chats");
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
        
        // If userId is provided, select that chat
        if (userId) {
          const chat = data.chats?.find((c: Chat) => 
            c.participants.some(p => p.id === userId)
          );
          if (chat) {
            setSelectedChat(chat._id);
          }
        } else if (data.chats?.length > 0) {
          setSelectedChat(data.chats[0]._id);
        }
      } else {
        // Mock chats
        const mockChats: Chat[] = [
          {
            _id: "1",
            isGroup: false,
            participants: [
              {
                id: "2",
                name: "Alice Johnson",
                username: "alicej",
                image: "",
                online: true,
              },
            ],
            lastMessage: {
              content: "Hey! How are you?",
              sender: { name: "Alice Johnson" },
              createdAt: new Date().toISOString(),
            },
            unreadCount: 2,
          },
          {
            _id: "2",
            isGroup: false,
            participants: [
              {
                id: "3",
                name: "Bob Smith",
                username: "bobsmith",
                image: "",
                online: false,
              },
            ],
            lastMessage: {
              content: "See you tomorrow!",
              sender: { name: "Bob Smith" },
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            unreadCount: 0,
          },
        ];
        setChats(mockChats);
        if (mockChats.length > 0) {
          setSelectedChat(mockChats[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setIsMessagesLoading(true);
      const res = await fetch(`/api/messages/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        // Mock messages
        setMessages([
          {
            _id: "1",
            content: "Hey! How are you doing?",
            sender: {
              id: "2",
              name: "Alice Johnson",
              username: "alicej",
              image: "",
            },
            chatId: chatId,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            read: true,
          },
          {
            _id: "2",
            content: "I'm good! Working on the new project.",
            sender: {
              id: session?.user?.id || "1",
              name: session?.user?.name || "You",
              username: session?.user?.username || "you",
              image: session?.user?.image || "",
            },
            chatId: chatId,
            createdAt: new Date(Date.now() - 300000).toISOString(),
            read: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedChat,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setNewMessage("");
        
        // Update last message in chat list
        setChats(prev =>
          prev.map(chat =>
            chat._id === selectedChat
              ? {
                  ...chat,
                  lastMessage: {
                    content: newMessage,
                    sender: { name: session?.user?.name || "You" },
                    createdAt: new Date().toISOString(),
                  },
                  unreadCount: 0,
                }
              : chat
          )
        );
      } else {
        // Mock send
        const mockMessage: Message = {
          _id: Date.now().toString(),
          content: newMessage,
          sender: {
            id: session?.user?.id || "1",
            name: session?.user?.name || "You",
            username: session?.user?.username || "you",
            image: session?.user?.image || "",
          },
          chatId: selectedChat,
          createdAt: new Date().toISOString(),
          read: true,
        };
        setMessages([...messages, mockMessage]);
        setNewMessage("");
        
        setChats(prev =>
          prev.map(chat =>
            chat._id === selectedChat
              ? {
                  ...chat,
                  lastMessage: {
                    content: newMessage,
                    sender: { name: session?.user?.name || "You" },
                    createdAt: new Date().toISOString(),
                  },
                  unreadCount: 0,
                }
              : chat
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.name || "Group Chat";
    const otherUser = chat.participants.find(p => p.id !== session?.user?.id);
    return otherUser?.name || "Unknown User";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return "";
    const otherUser = chat.participants.find(p => p.id !== session?.user?.id);
    return otherUser?.image;
  };

  const getChatUsername = (chat: Chat) => {
    if (chat.isGroup) return "";
    const otherUser = chat.participants.find(p => p.id !== session?.user?.id);
    return otherUser?.username || "user";
  };

  const getChatOnline = (chat: Chat) => {
    if (chat.isGroup) return false;
    const otherUser = chat.participants.find(p => p.id !== session?.user?.id);
    return otherUser?.online || false;
  };

  const filteredChats = chats.filter(chat =>
    getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Welcome to Zenthra
        </h2>
        <p className="text-gray-500 mt-2">Please sign in to see your messages</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const selectedChatData = chats.find(c => c._id === selectedChat);

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border dark:border-gray-800">
      {/* Chats List */}
      <div className="w-80 border-r dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {searchQuery ? "No chats found" : "No messages yet"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery ? "Try a different search" : "Start a conversation"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChat(chat._id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
                  selectedChat === chat._id && "bg-blue-50 dark:bg-blue-900/20"
                )}
              >
                <div className="relative flex-shrink-0">
                  <AvatarSimple
                    src={getChatAvatar(chat)}
                    fallback={getChatName(chat)?.[0] || "U"}
                    alt={getChatName(chat)}
                    size="md"
                  />
                  {getChatOnline(chat) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{getChatName(chat)}</p>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs text-gray-500 truncate">
                      {chat.lastMessage.sender.name !== session?.user?.name && `${chat.lastMessage.sender.name}: `}
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <Badge className="bg-blue-500 flex-shrink-0">
                    {chat.unreadCount}
                  </Badge>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
              <div className="flex items-center gap-3">
                <AvatarSimple
                  src={getChatAvatar(selectedChatData)}
                  fallback={getChatName(selectedChatData)?.[0] || "U"}
                  alt={getChatName(selectedChatData)}
                  size="md"
                />
                <div>
                  <p className="font-semibold">{getChatName(selectedChatData)}</p>
                  <p className="text-xs text-gray-500">
                    {getChatOnline(selectedChatData) ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isMessagesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400">Say hello!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={cn(
                      "flex",
                      message.sender.id === session?.user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.sender.id === session?.user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-[10px] opacity-70 mt-1 block">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isSending && sendMessage()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}