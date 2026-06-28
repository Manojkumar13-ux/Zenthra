"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Circle } from "lucide-react";

interface OnlineUsersProps {
  onUserSelect?: (userId: string) => void;
}

export function OnlineUsers({ onUserSelect }: OnlineUsersProps) {
  const { data: session } = useSession();
  const { isConnected, onlineUsers } = useSocket();
  const [onlineUsersData, setOnlineUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      if (!onlineUsers || onlineUsers.length === 0) {
        setOnlineUsersData([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userIds: onlineUsers }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setOnlineUsersData(data);
        } else {
          console.log("Failed to fetch online users, showing fallback");
          // Fallback: Just show user IDs as simple items
          setOnlineUsersData(
            onlineUsers.map((id: string) => ({
              _id: id,
              name: "User",
              username: id.substring(0, 8),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching online users:", error);
        // Fallback: Show user IDs
        setOnlineUsersData(
          onlineUsers.map((id: string) => ({
            _id: id,
            name: "User",
            username: id.substring(0, 8),
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
  }, [onlineUsers]);

  if (loading) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          <h4 className="text-sm font-semibold">Online Users</h4>
          <Badge variant="secondary" className="ml-auto">
            <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1" />
            Connecting...
          </Badge>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4" />
        <h4 className="text-sm font-semibold">Online Users</h4>
        <Badge variant="secondary" className="ml-auto">
          <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-1" />
          {onlineUsers.length} online
        </Badge>
      </div>

      {!isConnected && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Connecting to server...
        </p>
      )}

      {onlineUsers.length === 0 && isConnected && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No users online
        </p>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {onlineUsersData.map((user) => (
          <div
            key={user._id}
            className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg cursor-pointer transition-colors"
            onClick={() => onUserSelect?.(user._id)}
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback className="text-xs">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute bottom-0 right-0 h-2.5 w-2.5 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
            {session?.user?.id !== user._id && (
              <Badge variant="outline" className="text-[10px]">
                Online
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}