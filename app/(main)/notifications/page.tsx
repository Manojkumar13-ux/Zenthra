// app/(main)/notifications/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Repeat,
  Mail,
  Users,
  Trophy,
  CheckCheck,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  type:
    | "like"
    | "comment"
    | "mention"
    | "follow"
    | "message"
    | "repost"
    | "community"
    | "achievement";
  content: string;
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
  comment?: {
    _id: string;
    content: string;
  };
}

const notificationMessages: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  mention: "mentioned you",
  follow: "started following you",
  message: "sent you a message",
  repost: "reposted your post",
  community: "invited you to a community",
  achievement: "unlocked a new achievement",
};

const notificationIcons: Record<string, React.ReactNode> = {
  like: <Heart className="h-4 w-4 text-red-500" />,
  comment: <MessageCircle className="h-4 w-4 text-blue-500" />,
  mention: <Mail className="h-4 w-4 text-purple-500" />,
  follow: <UserPlus className="h-4 w-4 text-green-500" />,
  message: <Mail className="h-4 w-4 text-indigo-500" />,
  repost: <Repeat className="h-4 w-4 text-orange-500" />,
  community: <Users className="h-4 w-4 text-cyan-500" />,
  achievement: <Trophy className="h-4 w-4 text-yellow-500" />,
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "likes" | "comments" | "follows">("all");
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = new URL("/api/notifications", window.location.origin);
      if (filter !== "all") {
        url.searchParams.set("filter", filter);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch notifications");
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchNotifications();
    }
  }, [session, status, router, filter, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === notificationId ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    if (notification.post) {
      router.push(`/post/${notification.post._id}`);
    } else if (notification.sender) {
      router.push(`/profile/${notification.sender._id}`);
    }
  };

  const getTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="animate-pulse rounded bg-muted p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 text-center">
        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-semibold">No notifications</h2>
        <p className="mb-4 text-muted-foreground">Sign in to view your notifications</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "likes") return n.type === "like";
    if (filter === "comments") return n.type === "comment" || n.type === "mention";
    if (filter === "follows") return n.type === "follow";
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "unread" | "likes" | "comments" | "follows")}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="follows">Follows</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      {error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchNotifications}>
            Try Again
          </Button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-12 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "You're all caught up!" : `No ${filter} notifications found`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors",
                !notification.read
                  ? "bg-blue-50 hover:bg-blue-100/50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              {/* Avatar / Icon */}
              <div className="mt-1 flex-shrink-0">
                {notification.sender?.image ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.sender.image} />
                    <AvatarFallback>
                      {notification.sender.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    {notificationIcons[notification.type] || (
                      <Bell className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1">
                  {notification.sender && (
                    <span
                      className="cursor-pointer text-sm font-semibold hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${notification.sender._id}`);
                      }}
                    >
                      {notification.sender.name}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {notificationMessages[notification.type] || notification.content}
                  </span>
                </div>

                {notification.post && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    &ldquo;{notification.post.content}&rdquo;
                  </p>
                )}

                {notification.comment && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    &ldquo;{notification.comment.content}&rdquo;
                  </p>
                )}

                <div className="mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.read && (
                    <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
              </div>

              {/* Unread indicator */}
              {!notification.read && (
                <div className="shrink-0 flex-col items-end gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
