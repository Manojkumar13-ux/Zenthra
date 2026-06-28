"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Plus, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user");
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  // If user parameter exists, create or open chat with that user
  useEffect(() => {
    if (selectedUserId && session?.user?.id) {
      const createChat = async () => {
        try {
          const res = await fetch("/api/messages/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              participantIds: [selectedUserId],
              isGroup: false 
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedChat(data.chat._id);
            setSelectedUserId(null);
          }
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      };
      createChat();
    }
  }, [selectedUserId, session?.user?.id]);

  // Fetch chats
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/messages/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      const result = await res.json();
      return result.chats || result || [];
    },
    enabled: !!session?.user?.id,
  });

  // Search for users to start a new chat
  const handleSearchUsers = async () => {
    if (!searchUsers.trim()) {
      toast.error("Please enter a username to search");
      return;
    }
    
    setIsSearchingUsers(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchUsers)}`);
      if (res.ok) {
        const data = await res.json();
        setFoundUsers(data.users || []);
        if (data.users?.length === 0) {
          toast.error("No users found");
        }
      }
    } catch (error) {
      toast.error("Failed to search users");
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Debounce user search
  useEffect(() => {
    if (searchUsers.length > 1) {
      const debounce = setTimeout(handleSearchUsers, 500);
      return () => clearTimeout(debounce);
    }
  }, [searchUsers]);

  const handleCreateChat = async (userId: string) => {
    try {
      const res = await fetch("/api/messages/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          participantIds: [userId],
          isGroup: false 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedChat(data.chat._id);
        setShowNewChat(false);
        setFoundUsers([]);
        setSearchUsers("");
        refetch();
        toast.success("Chat created!");
      }
    } catch (error) {
      toast.error("Failed to create chat");
    }
  };

  const chats = Array.isArray(data) ? data : [];

  const filteredChats = chats.filter((chat: any) => {
    if (!searchQuery) return true;
    const otherUser = chat.participants?.find((p: any) => p._id !== session?.user?.id);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        <div className="w-1/3 border-r pr-2 overflow-y-auto">
          <div className="p-3">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Chat List */}
      <div className="w-1/3 border-r pr-2 overflow-y-auto flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by username or name..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-9"
                    />
                    {isSearchingUsers && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {foundUsers.map((user: any) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleCreateChat(user._id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image} />
                            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                            {user.isFollowing && (
                              <span className="text-xs text-green-500">Following</span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    ))}
                    {searchUsers && foundUsers.length === 0 && !isSearchingUsers && (
                      <div className="text-center py-4 text-gray-500">
                        <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No users found</p>
                        <p className="text-xs">Try a different search term</p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <OnlineUsers />
          <div className="mt-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400">Search for users to start a chat</p>
              </div>
            ) : (
              filteredChats.map((chat: any) => {
                const otherUser = chat.participants?.find((p: any) => p._id !== session?.user?.id);
                const isOnline = otherUser?.online || false;
                const unreadCount = chat.unreadCount || 0;

                return (
                  <Button
                    key={chat._id}
                    variant="ghost"
                    className={`w-full justify-start px-3 py-3 h-auto transition-colors ${
                      selectedChat === chat._id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
                    }`}
                    onClick={() => setSelectedChat(chat._id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser?.image} />
                          <AvatarFallback>{otherUser?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-sm truncate">
                          {chat.isGroup ? chat.name : otherUser?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {chat.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {chat.lastMessage?.createdAt && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(chat.lastMessage.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        {selectedChat ? (
          <ChatWindow 
            chatId={selectedChat} 
            onBack={() => setSelectedChat(null)} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No conversation selected</p>
              <p className="text-sm text-gray-400">Click + to start a new chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}