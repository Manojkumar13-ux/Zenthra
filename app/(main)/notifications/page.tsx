// app/(main)/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  AtSign,
  Users,
  Bell,
  Loader2,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

type Notification = {
  _id: string;
  type: "like" | "comment" | "mention" | "follow" | "repost" | "message" | "community";
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
};

const notificationIcons: Record<string, React.ReactNode> = {
  like: <Heart className="h-5 w-5 text-red-500" />,
  comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
  mention: <AtSign className="h-5 w-5 text-purple-500" />,
  follow: <UserPlus className="h-5 w-5 text-green-500" />,
  repost: <Repeat2 className="h-5 w-5 text-emerald-500" />,
  message: <MessageCircle className="h-5 w-5 text-indigo-500" />,
  community: <Users className="h-5 w-5 text-amber-500" />,
};

const notificationMessages: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  mention: "mentioned you",
  follow: "started following you",
  repost: "reposted your post",
  message: "sent you a message",
  community: "invited you to a community",
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, read: true }),
        credentials: "include",
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
        credentials: "include",
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification._id);
    
    if (notification.post) {
      router.push(`/post/${notification.post._id}`);
    } else if (notification.sender) {
      router.push(`/profile/${notification.sender._id}`);
    }
  };

  if (!mounted) {
    return <NotificationsSkeleton />;
  }

  if (status === "loading") {
    return <NotificationsSkeleton />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Please Sign In</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to view your notifications
          </p>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
        </Card>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            When someone interacts with your posts, you'll see it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                !notification.read
                  ? "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {notificationIcons[notification.type] || (
                  <Bell className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Avatar */}
              {notification.sender && (
                <Link
                  href={`/profile/${notification.sender._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.sender.image} />
                    <AvatarFallback>
                      {notification.sender.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm">
                      {notification.sender && (
                        <Link
                          href={`/profile/${notification.sender._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold hover:underline"
                        >
                          {notification.sender.name}
                        </Link>
                      )}
                      <span className="text-muted-foreground ml-1">
                        {notification.content || notificationMessages[notification.type] || "interacted with you"}
                      </span>
                    </p>
                    {notification.post && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.post.content}
                      </p>
                    )}
                    {notification.comment && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.comment.content}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse mt-1" />
        </div>
        <div className="h-9 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}