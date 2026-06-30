// app/(main)/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Repeat,
  Bell,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  type: "like" | "comment" | "follow" | "repost" | "mention" | "message";
  message: string;
  read: boolean;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  post?: {
    _id: string;
    content: string;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        // Mock notifications if API fails
        setNotifications([
          {
            _id: "1",
            type: "like",
            message: "liked your post",
            read: false,
            createdAt: new Date().toISOString(),
            sender: {
              _id: "2",
              name: "Alice Johnson",
              username: "alicej",
              image: "",
            },
            post: {
              _id: "1",
              content: "Hello world!",
            },
          },
          {
            _id: "2",
            type: "follow",
            message: "started following you",
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            sender: {
              _id: "3",
              name: "Bob Smith",
              username: "bobsmith",
              image: "",
            },
          },
          {
            _id: "3",
            type: "comment",
            message: "commented on your post",
            read: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            sender: {
              _id: "4",
              name: "Carol White",
              username: "carolw",
              image: "",
            },
            post: {
              _id: "1",
              content: "Hello world!",
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="h-4 w-4 text-red-500" />;
      case "comment": return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow": return <UserPlus className="h-4 w-4 text-green-500" />;
      case "repost": return <Repeat className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border dark:border-gray-800 p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                filter === "unread"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {filter === "all" ? "No notifications yet" : "No unread notifications"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "all"
              ? "When someone interacts with you, it will show up here"
              : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border dark:border-gray-800 transition-colors",
                !notification.read
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30"
                  : "bg-white dark:bg-gray-900"
              )}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="flex-shrink-0">
                <AvatarSimple
                  src={notification.sender.image}
                  fallback={notification.sender.name?.[0] || "U"}
                  alt={notification.sender.name}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.type)}
                  <Link
                    href={`/profile/${notification.sender._id}`}
                    className="font-semibold hover:underline"
                  >
                    {notification.sender.name}
                  </Link>
                  <span className="text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </span>
                </div>
                {notification.post && (
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    "{notification.post.content}"
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {getTimeAgo(notification.createdAt)}
                </p>
              </div>
              {!notification.read && (
                <Badge variant="default" className="flex-shrink-0 bg-blue-500">
                  New
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}